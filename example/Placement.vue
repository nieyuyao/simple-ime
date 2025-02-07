<script lang="ts" setup>
</script>

<template>
  <div>
    <div>
      <p>normal input</p>
      <input
        type="text"
        class="input-1"
      />
    </div>
    <div>
      <p>left side of input overflows screen</p>
      <input
        type="text"
        class="input-2"
      />
    </div>
    <div>
      <p>right side of input overflows screen</p>
      <input
        type="text"
        class="input-3"
      />
    </div>
    <div>
      <p>very long input</p>
      <input
        type="text"
        class="input-4"
      />
    </div>
    <div>
      <p>bottom side of textarea overflows screen</p>
      <textarea
        type="text"
        class="input-5"
      />
    </div>
    <div>
      <p>top side of textarea overflows screen</p>
      <textarea
        type="text"
        class="input-6"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input-2 {
  position: relative;
  left: -100px;
}
.input-3 {
  position: relative;
  left: calc(100% - 40px);
}
.input-4 {
  position: absolute;
  left: -100px;
  width: 4000px;
}
.input-5 {
  position: absolute;
  left: 0px;
  bottom: -200px;
  height: 400px;
}
.input-6 {
  position: absolute;
  left: 0px;
  top: -200px;
  height: 400px;
}
</style>
