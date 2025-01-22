<script lang="ts" setup>
const onInput = (e) => {
  console.log(e, '====input===')
}
const onCompositionStart = (e) => {
  console.log(e.data, '====compositionstart===')
}

const onCompositionUpdate = (e) => {
  console.log(e.data, '====compositionupdate===')
}

const onCompositionEnd = (e) => {
  console.log(e.data, '====compositionend===')
}
</script>

<template>
  <input
    type="text"
    @input="onInput"
    @compositionstart="onCompositionStart"
    @compositionupdate="onCompositionUpdate"
    @compositionend="onCompositionEnd"
  />
</template>
