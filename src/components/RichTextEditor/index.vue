<!-- components/QuillEditor.vue -->
<template>
  <div class="quill-editor">
    <div ref="editorRef" class="quill-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // 引入主题样式

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Object,
    default: () => ({
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['link', 'image', 'video'],
          [{ 'header': 1 }, { 'header': 2 }],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['clean']
        ]
      }
    })
  }
});

const emit = defineEmits(['update:modelValue']);
const editorRef = ref(null);
let quillEditor = null;

onMounted(() => {
  // 初始化Quill编辑器
  quillEditor = new Quill(editorRef.value, {
    ...props.options,
    theme: 'snow'
  });
  
  // 设置初始内容
  if (props.modelValue) {
    quillEditor.root.innerHTML = props.modelValue;
  }
  
  // 监听内容变化
  quillEditor.on('text-change', () => {
    emit('update:modelValue', quillEditor.root.innerHTML);
  });
});

onBeforeUnmount(() => {
  // 销毁编辑器
  if (quillEditor) {
    quillEditor.off('text-change');
    quillEditor = null;
  }
});

// 监听外部内容变化
watch(() => props.modelValue, (newValue) => {
  if (quillEditor && newValue !== quillEditor.root.innerHTML) {
    quillEditor.root.innerHTML = newValue;
  }
});
</script>

<style scoped>
.quill-container {
  height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>