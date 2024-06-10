const { LoggerFactory } = inject();
var otpauth = require('otpauth');

const logger = LoggerFactory.init();

class OTP {
  async generateSecret(key) {
    // Create Secret object
    var _key = key.replaceAll(' ', '');
    let _secret = otpauth.Secret.fromBase32(_key);
    return _secret;
  }

  async generateToken(secret) {
    // Use Secret object to generate OTP token
    let totp = new otpauth.TOTP({ secret: secret });
    let token = totp.generate();
    logger.info(`Generated token: '${token}'`);
    return token;
  }

  async getToken(key) {
    // Generate OTP Token from given secret key
    let _secret = await this.generateSecret(key);
    let _token = await this.generateToken(_secret);
    return _token;
  }
}

module.exports = new OTP();
module.exports.OTP = OTP;
