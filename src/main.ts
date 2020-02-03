import * as express from 'express';
import { Express, Request, Response } from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import config from './config';
import errorHandler from './middleware/error-handler';
import { InfraLogger as logger } from './logger';
import { join } from 'path';
import { importSchema } from 'graphql-import';

const init = async (): Promise<void> => {
    logger.info('Starting service');
    // Start the application
    const app: Express = express();

    try {
        const typeDefs = await importSchema(join(__dirname + '/modules/submission-adaptor/submission.graphql'));
        const apolloServer = new ApolloServer({ typeDefs });

        apolloServer.applyMiddleware({ app });
    } catch (e) {
        logger.trace(e);
    }

    // This is how we do dependency injection at the moment
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));
    // app.get('/authenticate/:token?', );
    app.use(errorHandler);

    app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
};

init();
