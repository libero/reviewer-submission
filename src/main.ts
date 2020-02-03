import * as express from 'express';
import { Express, Request, Response } from 'express';
import config from './config';

import errorHandler from './middleware/error-handler';
import { InfraLogger as logger } from './logger';

const init = async (): Promise<void> => {
    logger.info('Starting service');
    // Start the application
    const app: Express = express();

    // This is how we do dependency injection at the moment
    app.get('/health', (_: Request, res: Response) => res.sendStatus(200));
    // app.get('/authenticate/:token?', );
    app.use(errorHandler);

    app.listen(config.port, () => logger.info(`Service listening on port ${config.port}`));
};

init();
