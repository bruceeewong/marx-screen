<template>
  <div id="app">
    <main class="container">
      <section class="title">
        <img class="title__img" :src="img.title" alt="title">
      </section>

      <transition name="fade">
        <section v-if="status===WsStatus.IDLE" class="connect-tips">
          <div class="mp-code-wrapper">
            <img
              :src="mpCodeBase64"
              class="mp-code"
              alt="mp-code"
            />
          </div>
          <h3 class="text">扫码连接</h3>
          <small class="text">手机领取通行证后扫码进行登陆连接</small>
          <small class="text">成功连接即可领取专属登陆礼包</small>
        </section>
      </transition>

      <transition name="fade">
        <section
          v-if="status===WsStatus.READY"
          class="connect-tips"
        >
          <img
            :src="img.connected"
            class="connected-icon"
            alt="connected-icon"
          />
          <h3 class="text">「{{userInfo.name}}」已成功连接</h3>
          <small class="text">你乘坐的飞船即将登陆火星</small>
        </section>
      </transition>

      <section
        style="width: 100vw; height: 100vh; z-index: 999; position: absolute; top: 0; left: 0;"
        id="lottie-ani"
      >
      </section>

      <section ref="stage" id="stage" class="globe" :class="landingGlobeClass">
        <!-- <img :src="img.mars" alt="mars"> -->
      </section>

      <footer class="footer">
        <section class="land-count">
          <img :src="img.landCountIcon" class="land-count-icon" />
          <strong class="text">已有 {{landedCount}} 位人类成功登陆火星</strong>
          <img :src="img.landCountIcon" class="land-count-icon land-count-icon--right" />
        </section>
        <section class="land-users">
          <div
            v-for="user in landedUsers"
            :key="user._id"
            class="avatar"
          >
            <img class="avatar-border" :src="img.border" alt="">
            <div class="avatar-mask">
              <img
                :src="user.avatarUrl"
                class="avatar-img"
                alt="avatar"
              >
            </div>
          </div>
        </section>
      </footer>
    </main>

    <img class="huge-star" :class="landingLgStarClass" :src="img.hugeStar" alt="">
    <img class="small-star" :class="landingSmStarClass" :src="img.smallStar" alt="">

    <result-mask
      v-if="status === WsStatus.LANDED"
      :name="userInfo.name"
      :avatar-url="userInfo.avatarUrl"
      :rank="landResult.rank"
    ></result-mask>
  </div>
</template>

<script>
import IO from 'socket.io-client/dist/socket.io.dev';
import WsStatus from '@/enums/ws-status';
import ResultMask from '@/components/ResultMask.vue';
import lottie from 'lottie-web';
import lottieData from './lottie/data.json';
import loadMars from './threejs/index';

// const WS_URL = 'ws://localhost:3000';
const WS_URL = 'wss://bruski.wang';

export default {
  name: 'App',
  components: {
    ResultMask,
  },
  data() {
    return {
      io: null,
      lottie: null,
      mpCodeBase64: '',
      clientId: '',
      playerClientId: '',
      userInfo: {
        name: '',
        gender: '',
        earthCountry: '',
        marsArea: '',
        avatarUrl: '',
      },
      landResult: {
        landed: false,
        landedDate: '',
        rank: -1,
      },
      status: WsStatus.DISCONNECT,
      WsStatus,
      finished: false,
      landedUsers: [],
      landedCount: 0,
      img: {
        result: 'http://cdn.marx.bruski.wang/images/screen/screen-result.png',
        title: 'http://cdn.marx.bruski.wang/images/screen/title.png',
        landCountIcon: 'http://cdn.marx.bruski.wang/images/screen/border-sm.png',
        hugeStar: 'http://cdn.marx.bruski.wang/images/screen/huge-star.png',
        smallStar: 'http://cdn.marx.bruski.wang/images/screen/small-star.png',
        mars: 'http://cdn.marx.bruski.wang/images/screen/mars.png',
        connected: 'http://cdn.marx.bruski.wang/images/screen/connected.png',
        border: 'http://cdn.marx.bruski.wang/images/screen/border.png',
      },
    };
  },
  watch: {
    status(newVal) {
      console.log(`current status: ${newVal}`);
    },
  },
  computed: {
    tipsImg() {
      if (this.status === WsStatus.BUSY) {
        return this.img.connected;
      }
      return this.mpCodeBase64;
    },
    scanCodeClass() {
      const classArr = [];
      if (this.mpCodeBase64 && this.status === WsStatus.IDLE) {
        classArr.push('fade-in');
      } else {
        classArr.push('fade-out');
      }
      return classArr;
    },
    connectedClass() {
      const classArr = [];
      if (this.status === WsStatus.READY) {
        classArr.push('fade-in');
      } else {
        classArr.push('fade-out');
      }
      return classArr;
    },
    landingGlobeClass() {
      return this.status === WsStatus.LANDING ? 'globe--landing' : '';
    },
    landingSmStarClass() {
      return this.status === WsStatus.LANDING ? 'small-star--landing' : '';
    },
    landingLgStarClass() {
      return this.status === WsStatus.LANDING ? 'huge-star--landing' : '';
    },
  },
  async mounted() {
    this.initWebsocket();

    // 加载lottie播放器
    this.lottie = lottie.loadAnimation({
      container: document.getElementById('lottie-ani'),
      animationData: lottieData, // json文件路径
      assetsPath: '../', // 按照打包之后的Public文件存放路径加载... 有点hack
      loop: false,
      autoplay: false,
    });

    this.lottie.addEventListener('complete', () => {
      console.log('spaceship is landed');
      this.io.emit('land_on_mars');
    });

    loadMars(this.$refs.stage);
  },
  methods: {
    initWebsocket() {
      this.io = new IO(WS_URL, {
        reconnection: true,
        timeout: 30 * 60 * 1000, // 30min
        query: {
          clientType: 'screen',
        },
      });

      this.io.on('connect', () => {
        console.log('connected');
        this.setStatus(WsStatus.CONNECT);
      });

      this.io.on('disconnect', () => {
        console.log('disconnected');
        this.setStatus(WsStatus.DISCONNECT);
      });

      this.io.on('biz_error', (error) => {
        console.error('biz error', error);
        this.setStatus(WsStatus.DISCONNECT);
      });

      this.io.on('after_connect', (data) => {
        this.clientId = data.clientId;
        this.mpCodeBase64 = data.mpCodeBase64;
        this.landedUsers = data.landedUsers;
        this.landedCount = data.landedCount;

        console.log(`connection established: ${this.clientId}`);
        this.setStatus(WsStatus.IDLE);
      });

      this.io.on('player_join', (data) => {
        const {
          userInfo,
          clientId: playerClientId,
        } = data;
        console.log('oh, someone has joined the game: ', data);
        this.playerClientId = playerClientId;
        this.userInfo = JSON.parse(userInfo);
        this.setStatus(WsStatus.READY);
      });

      this.io.on('player_leave', (data) => {
        console.log('oh, someone has leave the game: ', data);
        setTimeout(() => {
          this.reset();
        }, 6 * 1000);
      });

      this.io.on('enter_space', (data) => {
        console.log('oh, someone has entered the space: ', data);
        this.setStatus(WsStatus.LANDING);
        this.playLandAnimation();
      });

      this.io.on('finished', (data) => {
        console.log('game finished: ', data);
        console.log(`登陆结果: ${data.landed}` ? '成功' : '失败');
        if (data.landed) {
          this.setStatus(WsStatus.LANDED);
          this.finished = true;
          this.landResult = {
            landed: data.landed,
            landedDate: data.landedDate,
            rank: data.rank,
          };
          this.landedUsers = data.landedUsers;
          this.landedCount = data.landedCount;
        } else {
          this.reset();
        }
      });

      this.io.on('refresh', (data) => {
        console.log('更新数据', data);
      });
    },

    setStatus(value = WsStatus.DISCONNECT) {
      this.status = value;
    },

    playLandAnimation() {
      console.log('shooooo, spaceship is landing~');
      this.lottie.goToAndPlay(0);
    },

    reset() {
      this.playerClientId = '';
      this.userInfo = {
        name: '',
        gender: '',
        earthCountry: '',
        marsArea: '',
        avatarUrl: '',
      };
      this.finished = false;
      this.setStatus(WsStatus.IDLE);
    },
  },
};
</script>

<style lang="scss">
$full-width: 1080px;
$full-height: 1920px;

$gradient-red-1: #ff593b;
$gradient-red-2: #c42916;
$red-gradient: linear-gradient(#ff593b, #c42916);

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
  position: relative;
  top: 0;
}
.fade-enter {
  opacity: 0;
  position: relative;
  top: #{100px / $full-height * 100}vh;
}
.fade-leave-to {
  opacity: 0;
  position: relative;
  top: -#{100px / $full-height * 100}vh;
}

body {
  margin: 0;
}

#app {
  z-index: -2;
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  background-image: url(http://cdn.marx.bruski.wang/images/screen/bg.png);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.text {
  background: linear-gradient(90deg, $gradient-red-1, $gradient-red-2);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title {
  margin-top: #{42px / $full-width * 100}vw;
}

.connect-tips {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.5s ease-in-out;

  h3 {
    margin: #{42px / $full-width * 100}vw 0 0;
    font-size: #{46px / $full-width * 100}vw;
    font-weight: bold;
  }
  small {
    margin: #{12px / $full-height * 100}vh 0 0;
    font-size: #{24px / $full-width * 100}vw;
    font-weight: bold;
  }

  small + small {
    margin-top: #{4px / $full-height * 100}vh;
  }

  &--show {
    opacity: 1;
  }
}

.mp-code {
  width: 100%;
  height: 100%;

  &-wrapper {
    box-sizing: border-box;
    padding: #{30px / $full-width * 100}vw;
    width: #{225px / $full-width * 100}vw;
    height: #{225px / $full-width * 100}vw;
    margin-top: #{140px / $full-width * 100}vw;
    border-radius: 50%;
    background: $red-gradient;
  }
}
.connected-icon {
  width: #{225px / $full-width * 100}vw;
  height: #{225px / $full-width * 100}vw;
    margin-top: #{140px / $full-width * 100}vw;
  transition: all 1s ease-in-out;
}

.footer {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  left: 50%;
  top: #{1711px / $full-height * 100}vh;
  transform: translateX(-50%);

  .land-count {
    display: flex;
    align-items: center;
  }

  strong {
    font-size: #{30px / $full-width * 100}vw;
    font-weight: bold;
    margin: 0 #{24px / $full-width * 100}vw;
  }
}

.land-count-icon {
  &--right {
    transform: rotate(180deg);
  }
}

.huge-star {
  z-index: -1;
  position: absolute;
  top: #{900px / $full-height * 100}vh;
  left: #{400px / $full-width * 100}vw;
  transition: all 1s ease-in-out;

  &--landing {
    transform: translate(-#{100px / $full-width * 100}vw, -#{100px / $full-width * 100}vw);
  }
}

.small-star {
  z-index: -1;
  position: absolute;
  top: #{413px / $full-height * 100}vh;
  left: #{70px / $full-width * 100}vw;
  width: #{170px / $full-width * 100}vw;
  height: #{170px / $full-width * 100}vw;
  transition: all 1s ease-in-out;

  &--landing {
    transform: translate(-#{60px / $full-width * 100}vw, -#{60px / $full-width * 100}vw);
  }
}

.globe {
  z-index: -1;
  position: absolute;
  left: 50%;
  bottom: #{256px / $full-height * 100}vh;
  transform: translateX(-50%);
  transition: all 1s ease-in-out;

  width: #{670px / $full-width * 100}vw;
  height: #{670px / $full-width * 100}vw;

  &--landing {
    transform: translate(-50%, -#{256px / $full-height * 100}vh);
  }

  img {
    width: 100%;
    height: 100%;
  }
}
.land-users {
  box-sizing: border-box;
  width: 90vw;
  margin-top: #{24px / $full-height * 100}vh;
  overflow: hidden;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.avatar {
  position: relative;
  width: #{74px / $full-width * 100}vw;
  height: #{82px / $full-height * 100}vh;

  &-border {
    z-index: 2;
    position: absolute;
    top: 0;
    width: #{74px / $full-width * 100}vw;
    object-fit: contain;
  }

  &-mask {
    overflow: hidden;
    width: 100%;
    height: 100%;
    mask: url(http://cdn.marx.bruski.wang/images/screen/mask.png) no-repeat top center / cover;
  }

  &-img {
    width: #{74px / $full-width * 100}vw;
    object-fit: contain;
  }
}

</style>
