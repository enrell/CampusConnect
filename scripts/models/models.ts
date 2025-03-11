import { Model } from './types';

// Define available models with metadata
export const availableModels: Model[] = [
  {
    name: "Para dispositivos topo de linha (recomendado)",
    size: "1.12 GB",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
  },
  {
    name: "Para dispositivos modestos",
    size: "531 MB",
    url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q5_k_m.gguf",
  },
];

// Special tokens for Qwen model architecture
export const SPECIAL_TOKENS = {
  IM_START: "<|im_start|>",
  IM_END: "<|im_end|>",
}; 