const { TM, LoggerFactory } = inject();

const Imap = require('imap');

const { utils } = require('../configs/core.js').config;

const logger = LoggerFactory.init();

const imapServer = new Imap({
  user: utils.email.user,
  password: utils.email.password,
  port: utils.email.port,
  host: utils.email.host,
  tls: true,
  tlsOptions: { servername: utils.email.host },
});

async function endConnection(message = null) {
  return new Promise(function (resolve) {
    imapServer.once('end', function () {
      resolve(message);
    });
    imapServer.end();
  });
}

function newConnection() {
  return new Promise(function (resolve) {
    imapServer.once('ready', resolve);
    imapServer.connect();
  });
}

function openMailBox(name, readOnly) {
  return new Promise(function (resolve, reject) {
    imapServer.openBox(name, readOnly, function (err, mailbox) {
      if (err) reject(err);
      else resolve(mailbox);
    });
  });
}

function getMail(request, process) {
  return collectEvents(request, 'message', 'error', 'end', process || collectEmail);
}

function collectEvents(thing, good, bad, end, munch) {
  // Collect a sequence of events, munching them as you go if you wish
  return new Promise(function (resolve, reject) {
    const ans = [];
    thing.on(good, function () {
      const args = [].slice.call(arguments);
      ans.push(munch ? munch.apply(null, args) : args);
    });
    if (bad) thing.on(bad, reject);
    thing.on(end, function () {
      Promise.all(ans).then(resolve);
    });
  });
}

function collectEmail(msg) {
  return new Promise(function (resolve) {
    const rel = collectEvents(msg, 'body', 'error', 'end', collectBody).then(function (x) {
      return x && x.length ? x : null;
    });
    resolve(rel);
  });
}

function collectBody(stream) {
  return new Promise(function (resolve) {
    const body = collectEvents(stream, 'data', 'error', 'end').then(function (bits) {
      return bits
        .map(function (c) {
          return c.toString('utf8');
        })
        .join('');
    });
    resolve(body);
  });
}

function searchForMessages(since, subject) {
  return new Promise(function (resolve, reject) {
    imapServer.seq.search(
      [
        ['SINCE', since],
        ['SUBJECT', subject],
      ],
      function (err, result) {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}

class Email {
  constructor() {
    /** @type {boolean} Indicates if credentials are configured when email utility is enabled */
    this.credentialsConfigured = false;

    if (utils.email.enabled && utils.email.password !== '' && utils.email.user !== '') {
      this.credentialsConfigured = true;
    }
  }

  /**
   * Gets the most recently received email's body and headers with the given subject
   *
   * @param {string} subject The subject of the email message
   * @param {Date} since The date from which the emails will be fetched from, defaults to yesterday's date
   * @returns {object} The email body and the email headers
   */
  async getMessage(subject, since = Date.now() - 24 * 3600 * 1000) {
    if (!this.credentialsConfigured) {
      let errorMsg = utils.email.enabled
        ? 'Email credentials are not configured, set AI__UTILS_EMAIL_PASSWORD and AI__UTILS_EMAIL_USER env variables'
        : 'Email utility is not enabled, set AI__UTILS_EMAIL to true';

      await TM.fail(errorMsg);
    }

    let message = await newConnection()
      .then(function () {
        logger.debug(
          `Connected to ${imapServer._config.host} with user ${imapServer._config.user}`,
        );
      })
      .then(function () {
        return openMailBox('INBOX', true);
      })
      .then(function () {
        return searchForMessages(since, subject);
      })
      .then(function (result) {
        return getMail(
          imapServer.seq.fetch(result, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
          }),
          function (message) {
            return collectEmail(message);
          },
        );
      })
      .then(function (messages) {
        return endConnection(messages[messages.length - 1]);
      })
      .then(async function (message) {
        return message;
      })
      .catch(async function (error) {
        imapServer.end();

        let errorMsg = `An error occured while fetching email: ${error.message}`;
        logger.error(errorMsg);
        await TM.fail(errorMsg);
      });

    let messageBody = message['0'];
    let messageHeader = message['1'];

    logger.debug(`Message body fetched:\n${messageBody}`);
    logger.debug(`Message headers fetched:\n${messageHeader}`);

    return { emailBody: messageBody, emailHeader: messageHeader };
  }
}

module.exports = new Email();
module.exports.Email = Email;
