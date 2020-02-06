import * as express from 'express';
import * as helmet from 'helmet';
import * as knex from 'knex';
import { Express, Request, Response } from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import config from './config';
import { InfraLogger as logger } from './logger';
import { join } from 'path';
import { importSchema } from 'graphql-import';
import { SubmissionService } from './services/submission';
import { SubmissionResolvers, SurveyResolvers, UserResolvers } from './resolvers';
import { SurveyService } from './services/survey';
import { UserService } from './services/user';
import { verify } from 'jsonwebtoken';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

// Apollo server express does not export this, but its experss
export interface ExpressContext {
    req: Request;
    res: Response;
}

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
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));
    try {
        const typeDefs = await importSchema(join(__dirname, './schemas/**/*.graphql'), {
            forceGraphQLImport: false,
            skipGraphQLImport: true,
        });
        const apolloServer = new ApolloServer({
            typeDefs,
            resolvers,
            context: ({ req }: ExpressContext): { userId: string } => {
                try {
                    // @todo: we need to use the correct libero auth token
                    const token = (req.headers.authorization || '').split(' ')[1];
                    const decodedToken = verify(token, config.authentication_jwt_secret) as { sub: string };
                    return { userId: decodedToken.sub };
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
    } catch (e) {
        logger.trace(e);
    }

    app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
};

init();
