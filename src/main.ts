import * as express from 'express';
import * as helmet from 'helmet';
import * as knex from 'knex';
import { Express, Request, Response } from 'express';
import { ApolloServer, AuthenticationError, makeExecutableSchema, UserInputError } from 'apollo-server-express';
import config, { S3Config } from './config';
import { InfraLogger as logger } from './logger';
import { join } from 'path';
import { importSchema } from 'graphql-import';
import { verify } from 'jsonwebtoken';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import * as hpp from 'hpp';
import * as depthLimit from 'graphql-depth-limit';
import { simpleEstimator, fieldExtensionsEstimator, directiveEstimator, getComplexity } from 'graphql-query-complexity';
import { separateOperations } from 'graphql';
import { Server } from 'http';
import { SubmissionService } from './domain/submission';
import { SurveyService } from './domain/survey';
import { UserResolvers, UserService } from './domain/user';
import { DashboardResolvers } from './application/dashboard/resolvers';
import { DashboardService } from './application/dashboard/service';
import { WizardService } from './application/wizard/service';
import { WizardResolvers } from './application/wizard/resolvers';
import { TeamService } from './domain/teams/services/team-service';
import { PermissionService } from './application/permission/service';
import { SemanticExtractionService } from './domain/semantic-extraction/services/semantic-extraction-service';
import { FileService } from './domain/file/services/file-service';
import { AuditService } from './domain/audit/services/audit';
import { S3Store } from './domain/submission/services/storage/s3-store';
import { SftpStore } from './domain/submission/services/storage/sftp-store';
import { KnexEJPNamesRepository } from './domain/ejp-name/repositories/ejp-name';
import { MecaExporter } from './domain/submission/services/exporter/meca-exporter';
import * as S3 from 'aws-sdk/clients/s3';
import { createKnexAdapter } from './domain/knex-table-adapter';

// found via https://github.com/digicatapult/graphql-complexity-experiment/blob/master/app/apollo.js
const estimators = [
    // complexity based on field extension in resolver
    fieldExtensionsEstimator(),
    // complexity based on SDL directives
    directiveEstimator(),
    // fallback complexity when no other value is provided
    simpleEstimator({ defaultComplexity: 1 }),
];

const dumpConfig = (): void => {
    logger.info(`config.port: ${config.port}`);
    logger.info(`config.db_connection.host: ${config.db_connection.host}`);
    logger.info(`config.s3.awsEndPoint: ${config.s3.awsEndPoint}`);
    logger.info(`config.s3.fileBucket: ${config.s3.fileBucket}`);
    logger.info(`config.user_api_url: ${config.user_api_url}`);
    logger.info(`config.science_beam.api_url: ${config.science_beam.api_url}`);
};

const createS3 = (s3config: S3Config): S3 => {
    const defaultOptions = {
        accessKeyId: s3config.accessKeyId,
        secretAccessKey: s3config.secretAccessKey,
        apiVersion: '2006-03-01',
        signatureVersion: 'v4',
        s3ForcePathStyle: s3config.s3ForcePathStyle,
    };
    const s3Options = s3config.awsEndPoint ? { ...defaultOptions, endpoint: s3config.awsEndPoint } : defaultOptions;
    return new S3(s3Options);
};

const init = async (): Promise<void> => {
    logger.info('Starting service');
    dumpConfig();
    // Start the application
    const app: Express = express();
    const knexConnection = knex({
        client: 'pg',
        connection: config.db_connection,
    });

    const shutDown = async (server: Server): Promise<void> => {
        await knexConnection.destroy();
        server.close(() => logger.info(`server closed`));
        process.exit();
    };

    logger.info(`Initialising domain services...`);
    const srvAudit = new AuditService(knexConnection);
    const srvSurvey = new SurveyService(knexConnection);
    const srvUser = new UserService(config.user_api_url);
    const srvTeam = new TeamService(knexConnection);
    const srvFile = new FileService(knexConnection, createS3(config.s3), config.s3.fileBucket, srvAudit);
    const s3Store = new S3Store(config.s3, config.meca_config);
    const sftpStore = new SftpStore(config.meca_config);
    const ejpNames = new KnexEJPNamesRepository(createKnexAdapter(knexConnection, 'public'));
    const mecaExporter = new MecaExporter(srvFile, ejpNames, config.authentication_jwt_secret);
    const srvSubmission = new SubmissionService(knexConnection, mecaExporter, s3Store, sftpStore);
    const srvExtractionService = new SemanticExtractionService(knexConnection, config.science_beam);

    logger.info(`Initialising application services...`);
    const srvPermission = new PermissionService();
    const srvDashboard = new DashboardService(srvPermission, srvSubmission);
    const srvWizard = new WizardService(srvPermission, srvSubmission, srvTeam, srvFile, srvExtractionService, config);

    const resolvers = [
        DashboardResolvers(srvDashboard, srvUser),
        UserResolvers(srvUser),
        WizardResolvers(srvWizard, srvUser, srvSurvey),
    ];

    logger.info(`Initialising Express...`);

    // best to mount helmet so soon as possible to ensure headers are set: defaults - https://www.npmjs.com/package/helmet#how-it-works
    app.use(helmet());
    app.use(hpp());
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));

    const typeDefs = await importSchema(join(__dirname, './schemas/**/*.graphql'), {
        forceGraphQLImport: false,
        skipGraphQLImport: true,
    });
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    logger.info(`Initialising ApolloServer...`);
    const apolloServer = new ApolloServer({
        schema,
        uploads: {
            maxFileSize: config.max_file_size_in_bytes,
        },
        plugins: [
            {
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                requestDidStart: () => ({
                    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                    didResolveOperation({ request, document }) {
                        // @todo: may need to have resolver level complexity.
                        // This needs to be revisited when the queries and their complexities are known
                        const complexity = getComplexity({
                            schema,
                            query: request.operationName
                                ? separateOperations(document)[request.operationName]
                                : document,
                            variables: request.variables,
                            estimators,
                        });
                        if (complexity >= config.max_ql_complexity) {
                            throw new UserInputError(
                                `${complexity} is over max ${config.max_ql_complexity} complexity`,
                            );
                        }
                    },
                }),
            },
        ],
        validationRules: [depthLimit(config.max_ql_depth)],
        // @todo: Introspection queries will be blocked unless you are authenticated.
        // The point to consider - is this expected behaviour or should it allow Introspection regardless of auth status.
        context: ({ req, connection }): { userId: string; authorizationHeader: string } => {
            if (connection) {
                return connection.context;
            }
            try {
                // @todo: we need to use the correct libero auth token
                const token = (req.headers.authorization || '').split(' ')[1];
                const decodedToken = verify(token, config.authentication_jwt_secret) as { sub: string };
                return { userId: decodedToken.sub, authorizationHeader: req.headers.authorization || '' };
            } catch (e) {
                throw new AuthenticationError('You must be logged in');
            }
        },
        formatError: (error: GraphQLError): GraphQLFormattedError => {
            // @todo: revisit how we handle errors
            logger.error(error.message, (error.originalError && error.originalError.stack) || '');
            return error;
        },
        subscriptions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onConnect: (connectionParams: any): any => {
                if (connectionParams.Authorization) {
                    const token = connectionParams.Authorization.split(' ')[1];
                    const decodedToken = verify(token, config.authentication_jwt_secret) as {
                        sub: string;
                    };
                    return { userId: decodedToken.sub, authorizationHeader: connectionParams.Authorization };
                }
                throw new Error('Missing auth token!');
            },
        },
    });
    apolloServer.applyMiddleware({ app });
    const server = app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
    apolloServer.installSubscriptionHandlers(server);
    process.on('SIGTERM', async () => await shutDown(server));
    process.on('SIGINT', async () => await shutDown(server));
};

init();
