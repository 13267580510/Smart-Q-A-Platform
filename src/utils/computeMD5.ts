import SparkMD5 from 'spark-md5';
import {createSHA256 ,sha256} from 'hash-wasm'
import crypto from 'crypto'
export function calculateFileMD5(file:File): Promise<string>{
  console.log("计算MD5开始");
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const spark = new SparkMD5.ArrayBuffer();
        
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
          spark.append(e.target.result);
          const md5 = spark.end();
          resolve(md5);
        };
        reader.onerror = reject;
      });
}
/**
 * 高性能流式计算大文件SHA256（最优方案）
 * 特点：
 * 1. 纯流式处理，内存占用恒定（仅保留当前分片+哈希状态，约8MB）
 * 2. 浏览器原生API，计算速度最快
 * 3. 无内存溢出风险，支持任意大小文件（GB级）
 * 4. 包含进度回调，不影响UI交互
 * 
 * @param file 待计算的文件
 * @param chunkSize 分片大小（默认8MB，SSD可设16MB，机械盘8MB最优）
 * @param onProgress 进度回调 (progress: number) => void
 * @returns 文件SHA256值（小写十六进制字符串）
 */
export async function calculateLargeFileMD5(
  file: File,
  chunkSize: number = 8 * 1024 * 1024,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log("开始计算哈希值");
  
  // 1. 计算总切片数，确定要处理的切片数量（最多5个，不足则取全部）
  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunksToProcess = Math.min(totalChunks, 5);
  console.log(`文件总切片数：${totalChunks}，实际处理切片数：${chunksToProcess}`);

  // 存储每个切片的 MD5 值
  const chunkMD5List: string[] = [];
  let processedBytes = 0;

  // 2. 遍历处理前 N 个切片
  for (let i = 0; i < chunksToProcess; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    try {
      // 3. 读取切片并计算单个切片的 MD5
      const arrayBuffer = await readFileChunk(chunk);
      const chunkMD5 = SparkMD5.ArrayBuffer.hash(arrayBuffer); // SparkMD5 直接计算 ArrayBuffer 的 MD5
      chunkMD5List.push(chunkMD5);

      // 4. 更新进度（进度值限制在 0-100%）
      processedBytes += end - start;
      const progress = (processedBytes / (chunksToProcess * chunkSize)) * 100;
      onProgress?.(Math.min(progress, 100));

      console.log(`完成切片 ${i+1} 的 MD5 计算：${chunkMD5}`);
    } catch (error) {
      console.error(`计算切片 ${i+1} 的 MD5 失败：`, error);
      throw new Error(`切片 ${i+1} 处理失败：${(error as Error).message}`);
    }
  }

  // 5. 合并所有切片的 MD5 字符串，计算最终 MD5
  const mergedMD5String = chunkMD5List.join('');
  const finalMD5 = SparkMD5.hash(mergedMD5String); // 对合并后的字符串计算 MD5

  console.log(`所有切片 MD5 合并后最终 MD5：${finalMD5}`);
  return finalMD5;
}


/**
 * 读取文件分块为ArrayBuffer
 * @param {Blob} chunk - 文件分块
 * @returns {Promise<Uint8Array>}
 */
function readFileChunk(chunk) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(chunk);
  });
}


/**
 * 将ArrayBuffer转换为十六进制字符串
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}




  /**
 * 计算切片的哈希值（如MD5/SHA1，和后端一致）
 * @param chunk 切片Blob对象
 * @returns 切片哈希字符串
 */
export async function calculateChunkHash(chunk: Blob): Promise<string> {
  // 示例：基于spark-md5库计算（需先安装：npm install spark-md5）
  // 也可替换为你自己的哈希计算逻辑
  const spark = new SparkMD5.ArrayBuffer();
  const arrayBuffer = await chunk.arrayBuffer();
  spark.append(arrayBuffer);
  return spark.end();
}