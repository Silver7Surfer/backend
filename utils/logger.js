class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        // Set default log level from environment or default to INFO
        this.currentLevel = this.logLevels[process.env.LOG_LEVEL || 'INFO'];
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const logData = data ? JSON.stringify(data, null, 2) : '';
        return `[${timestamp}] ${level}: ${message} ${logData}`;
    }

    error(message, data = null) {
        if (this.currentLevel >= this.logLevels.ERROR) {
            console.error(this.formatMessage('ERROR', message, data));
        }
    }

    warn(message, data = null) {
        if (this.currentLevel >= this.logLevels.WARN) {
            console.warn(this.formatMessage('WARN', message, data));
        }
    }

    info(message, data = null) {
        if (this.currentLevel >= this.logLevels.INFO) {
            console.log(this.formatMessage('INFO', message, data));
        }
    }

    debug(message, data = null) {
        if (this.currentLevel >= this.logLevels.DEBUG) {
            console.log(this.formatMessage('DEBUG', message, data));
        }
    }

    // Utility method to change log level
    setLogLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.currentLevel = this.logLevels[level];
        }
    }

    // Method to log API requests
    logAPIRequest(req, status, responseTime) {
        this.info(`API ${req.method} ${req.originalUrl}`, {
            status,
            responseTime: `${responseTime}ms`,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        });
    }

    // Method to log deposit events
    logDeposit(userId, depositData) {
        this.info(`Deposit processed for user ${userId}`, {
            currency: depositData.currency,
            amount: depositData.amount,
            txHash: depositData.txHash,
            timestamp: new Date().toISOString()
        });
    }

    // Method to log errors with stack trace
    logError(error, context = {}) {
        this.error(error.message, {
            ...context,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}

// Create and export a single instance
export default new Logger();