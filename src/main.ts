import * as express from 'express';
import * as helmet from 'helmet';
import * as knex from 'knex';
import { Express, Request, Response } from 'express';
import { ApolloServer, AuthenticationError, makeExecutableSchema, UserInputError } from 'apollo-server-express';
import config from './config';
import { InfraLogger as logger } from './logger';
import { join } from 'path';
import { importSchema } from 'graphql-import';
import { verify } from 'jsonwebtoken';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import * as hpp from 'hpp';
import * as depthLimit from 'graphql-depth-limit';
import { simpleEstimator, fieldExtensionsEstimator, directiveEstimator, getComplexity } from 'graphql-query-complexity';
import { separateOperations } from 'graphql';
import { SubmissionService } from './submission/models/submission-service';
import { SubmissionResolvers } from './submission/resolvers/submission';
import { SurveyResolvers } from './survey/resolvers/survey';
import { SurveyService } from './survey/models/survey-service';
import { UserResolvers } from './user/resolvers/user';
import { UserService } from './user/models/user-service';

// Apollo server express does not export this, but its express
export interface ExpressContext {
    req: Request;
    res: Response;
}

// found via https://github.com/digicatapult/graphql-complexity-experiment/blob/master/app/apollo.js
const estimators = [
    // complexity based on field extension in resolver
    fieldExtensionsEstimator(),
    // complexity based on SDL directives
    directiveEstimator(),
    // fallback complexity when no other value is provided
    simpleEstimator({ defaultComplexity: 1 }),
];

const init = async (): Promise<void> => {
    logger.info('Starting service');
    // Start the application
    const app: Express = express();
    const knexConnection = knex(config.knex);
    const resolvers = [
        SubmissionResolvers(new SubmissionService(knexConnection)),
        SurveyResolvers(new SurveyService(knexConnection)),
        UserResolvers(new UserService(config.user_adapter_url)),
    ];
    // best to mount helmet so soon as possible to ensure headers are set: defaults - https://www.npmjs.com/package/helmet#how-it-works
    app.use(helmet());
    app.use(hpp());
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));

    const typeDefs = await importSchema(join(__dirname, './schemas/**/*.graphql'), {
        forceGraphQLImport: false,
        skipGraphQLImport: true,
    });
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const apolloServer = new ApolloServer({
        schema,
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
        context: ({ req }: ExpressContext): { userId: string; authorizationHeader: string } => {
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
            return error;
        },
    });
    apolloServer.applyMiddleware({ app });

    app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
};

init();
