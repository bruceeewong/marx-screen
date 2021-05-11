import axios from 'axios';

import cloudConfig from '@/conf/cloud';

class CloudAPI {
  constructor() {
    this.prefix = 'https://api.weixin.qq.com';
  }

  getAccessToken() {
    return axios({
      url: `${this.prefix}/cgi-bin/token`,
      method: 'get',
      params: {
        grant_type: cloudConfig.grant_type,
        appid: cloudConfig.appid,
        secret: cloudConfig.secret,
      },
    });
  }

  invokeCloudFunction(accessToken, env, funcName) {
    return axios({
      url: `${this.prefix}/invokecloudfunction`,
      method: 'post',
      params: {
        env,
        access_token: accessToken,
        name: funcName,
      },
    });
  }
}

export default new CloudAPI();
