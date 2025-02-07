<script lang="ts" setup>
function onInput(e) {
  console.log(e, '====input===')
}
function onCompositionStart(e) {
  console.log(e.data, '====compositionstart===')
}

function onCompositionUpdate(e) {
  console.log(e.data, '====compositionupdate===')
}

function onCompositionEnd(e) {
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
  >
</template>
