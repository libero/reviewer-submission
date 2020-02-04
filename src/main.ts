import * as express from 'express';
import * as helmet from 'helmet';
import * as knex from 'knex';
import { Express, Request, Response } from 'express';
import { ApolloServer } from 'apollo-server-express';
import config from './config';
import errorHandler from './middleware/error-handler';
import { InfraLogger as logger } from './logger';
import { join } from 'path';
import { importSchema } from 'graphql-import';
import { SubmissionService } from './services/submission';
import SubmssionResolver from './resolvers/submission';

const init = async (): Promise<void> => {
    logger.info('Starting service');
    // Start the application
    const app: Express = express();
    const knexConnection = knex(config.knex);
    // TODO: this needs thinking
    const resolvers = SubmssionResolver(new SubmissionService(knexConnection));
    // best to mount helmet so soon as possible to ensure headers are set: defaults - https://www.npmjs.com/package/helmet#how-it-works
    app.use(helmet());
    try {
        const typeDefs = await importSchema(join(__dirname + '/schemas/submission.graphql'));
        const apolloServer = new ApolloServer({ typeDefs, resolvers });
        apolloServer.applyMiddleware({ app });
    } catch (e) {
        logger.trace(e);
    }

    // This is how we do dependency injection at the moment
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));
    app.use(errorHandler);

    app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
};

init();
