<template>
  <div class="mask">
    <div class="avatar">
      <img :src="img.light" class="avatar-light" />
      <img class="avatar-border" :src="img.border" alt="border">
      <div class="avatar-mask">
        <img
          :src="avatarUrl"
          class="avatar-img"
          alt="avatar"
        >
      </div>
    </div>
    <section class="congrats">
      <h2 class="text">恭喜「{{name}}」成为</h2>
      <h2 class="text">火星第 {{rank}} 位登陆者</h2>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ResultMask',
  props: {
    name: {
      type: String,
      default: '占位符',
    },
    avatarUrl: {
      type: String,
      default: '占位符',
    },
    rank: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      img: {
        border: 'http://cdn.marx.bruski.wang/images/screen/border.png',
        light: 'http://cdn.marx.bruski.wang/images/screen/light.png',
      },
    };
  },
};
</script>

<style lang="scss" scoped>

$full-width: 1080px;
$full-height: 1920px;

$gradient-red-1: #ff593b;
$gradient-red-2: #c42916;
$red-gradient: linear-gradient(#ff593b, #c42916);

@keyframes rotate {
  from {transform: rotate(0);}
  to {transform: rotate(360deg);}
}

.mask {
  z-index: 999;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(0,0,0,0.4);
}

.avatar {
  position: relative;
  width: #{330px / $full-width * 100}vw;
  height: #{365px / $full-height * 100}vh;
  margin-top: #{517px / $full-height * 100}vh;

  &-border {
    z-index: 2;
    position: absolute;
    top: 0;
    width: #{330px / $full-width * 100}vw;
    object-fit: contain;
  }

  &-mask {
    overflow: hidden;
    width: 100%;
    height: 100%;
    mask: url(http://cdn.marx.bruski.wang/images/screen/mask.png) no-repeat top center / cover;
  }

  &-light {
    z-index: -1;
    position: absolute;
    top: -70%;
    left: -75%;
    width: #{832px / $full-width * 100}vw;
    object-fit: contain;
    animation: rotate 8s infinite linear;
  }

  &-img {
    width: #{330px / $full-width * 100}vw;
    object-fit: contain;
  }
}

.text {
  background: linear-gradient(90deg, $gradient-red-1, $gradient-red-2);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.congrats {
  margin-top: #{160px / $full-height * 100}vh;

  h2 {
    text-align: center;
    font-size: #{60px / $full-width * 100}vw;
    margin: 0;
  }
}
</style>
