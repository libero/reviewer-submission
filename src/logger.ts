import * as pino from 'pino';

const Logger = pino();

const ServiceLogger = Logger.child({ service: 'continuum-adaptor' });

export const InfraLogger = ServiceLogger.child({ realm: 'infra' });
export const DomainLogger = ServiceLogger.child({ realm: 'domain' });

export default Logger;
