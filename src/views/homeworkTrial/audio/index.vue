<template>
  <div class="audio-assessment-container">
    <div class="card-container">
      <!-- 卡片1: 音频脚本 -->
      <el-card class="box-card script-card">
        <div slot="header" class="clearfix">
          <span class="card-title">语音训练</span>
        </div>
        <div class="content">
          <div class="script-tabs">
            <el-tabs v-model="activeScriptTab">
              <el-tab-pane label="练习题库" name="preset">
                <div class="preset-scripts-container">
                  <!-- 左侧主题按钮列表 -->
                  <div class="preset-scripts-menu">
                    <div v-for="script in presetScripts" :key="script.id" class="script-item">
                      <el-button 
                        :type="selectedScriptId === script.id ? 'primary' : 'text'"
                        class="script-select-button"
                        @click="selectScript(script.id)">
                        {{ script.title }}
                      </el-button>
                    </div>
                  </div>
                  
                  <!-- 右侧内容展示区 -->
                  <div class="script-content-area">
                    <div v-if="selectedScript" class="script-content">
                      <p>{{ selectedScript.content }}</p>
                    </div>
                    <div v-else class="no-content-selected">
                      <p>请选择一个主题进行练习</p>
                    </div>
                  </div>
                </div>
                
                <!-- 预设脚本的按钮固定在右下角 -->
                <div class="preset-script-fixed-action">
                  <el-button size="small" type="primary" @click="submitPresetScript" :disabled="!selectedScript">上传口语练习内容</el-button>
                </div>
              </el-tab-pane>
              <el-tab-pane label="自定义练习" name="custom">
                <div class="custom-script">
                  <el-input
                    type="textarea"
                    :rows="6"
                    placeholder="请输入您的个性化口语练习内容..."
                    v-model="customScriptContent"
                    @input="checkWordCount">
                  </el-input>
                  <div class="word-count" :class="{ 'word-count-warning': isWordCountExceeded }">
                    已输入 {{ wordCount }} 个单词，最多允许 1000 个单词
                  </div>
                  <div class="script-actions">
                    <el-button size="small" type="primary" @click="submitCustomScript" :disabled="!customScriptContent.trim() || isWordCountExceeded">上传口语练习内容</el-button>
                    <el-button size="small" @click="clearCustomScript" :disabled="!customScriptContent.trim()">清空</el-button>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-card>

      <!-- 卡片2: 音频上传 -->
      <el-card class="box-card upload-card">
        <div slot="header" class="clearfix">
          <span class="card-title">语音上传</span>
        </div>
        <div class="content">
          <div class="upload-section">
            <el-upload
              class="audio-uploader"
              action="#"
              :auto-upload="false"
              :on-change="handleAudioChange"
              :show-file-list="false"
              accept=".wav,.pcm">
              <i class="el-icon-plus avatar-uploader-icon"></i>
              <div class="upload-text">点击上传您的口语练习音频</div>
              <div class="upload-tip">仅支持未压缩的PCM或WAV格式音频</div>
            </el-upload>
            
            <div v-if="audioUrl" class="audio-preview">
              <audio ref="audioPlayer" controls :src="audioUrl"></audio>
              <div class="file-info">
                <span>{{ audioName }}</span>
                <span>{{ audioSize }}</span>
              </div>
            </div>
          </div>
          
          <div class="controls">
            <el-button type="primary" @click="startAssessment" :disabled="!audioUrl">
              点击评估您的口语
            </el-button>
            <el-button @click="resetAudio" :disabled="!audioUrl">重置</el-button>
          </div>
          
          <div v-if="isAssessing" class="assessment-progress">
            <el-progress :percentage="assessmentProgress" :format="progressFormat"></el-progress>
            <div class="progress-text">正在评估音频，请稍候...</div>
          </div>
        </div>
      </el-card>

      <!-- 卡片3: 评估结果 -->
      <el-card class="box-card result-card">
        <div slot="header" class="clearfix">
          <span class="card-title">评估结果</span>
        </div>
        <div class="content">
          <template v-if="assessmentResult">
            <div v-if="assessmentResult.isRejected" class="result-rejected">
              <el-alert
                :title="assessmentResult.feedback"
                type="error"
                :closable="false"
                show-icon>
              </el-alert>
              <div class="rejection-explanation">
                <p><strong>提示：</strong>引擎检测到乱读，分值不能作为参考。请确保按照文本内容准确朗读，不要添加、省略或替换单词。</p>
                <p>建议重新录制音频并确保：</p>
                <ul>
                  <li>在安静的环境中录音</li>
                  <li>清晰地朗读所有文本内容</li>
                  <li>不要在朗读过程中添加额外的内容</li>
                </ul>
              </div>
            </div>
            <template v-else>
              <div class="result-item">
                <span class="item-label">发音准确度：</span>
                <el-rate
                  v-model="assessmentResult.pronunciation"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value}">
                </el-rate>
              </div>
              <div class="result-item">
                <span class="item-label">语调自然度：</span>
                <el-rate
                  v-model="assessmentResult.intonation"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value}">
                </el-rate>
              </div>
              <div class="result-item">
                <span class="item-label">流利度：</span>
                <el-rate
                  v-model="assessmentResult.fluency"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="{value}">
                </el-rate>
              </div>
              <div class="result-item">
                <span class="item-label">总体评分：</span>
                <span class="total-score">{{ assessmentResult.totalScore }}</span>
              </div>
              <div class="result-feedback">
                <h4>评估反馈：</h4>
                <p>{{ assessmentResult.feedback }}</p>
              </div>
              
              <!-- 发音建议 -->
              <div class="pronunciation-tips" style="max-height: none; overflow: visible;">
                <h4>发音建议</h4>
                <ul>
                  <li v-for="(tip, index) in assessmentResult.pronunciationTips" :key="index">
                    {{ tip }}
                  </li>
                </ul>
              </div>
            </template>
          </template>
          <div v-else class="empty-result">
            <i class="el-icon-data-analysis empty-icon"></i>
            <p class="empty-text">请上传音频并开始评估以查看结果</p>
          </div>
        </div>
      </el-card>

      <!-- 卡片4: 详细分析 -->
      <el-card class="box-card analysis-card">
        <div slot="header" class="clearfix">
          <span class="card-title">详细分析</span>
        </div>
        <div class="content">
          <template v-if="assessmentResult && !assessmentResult.isRejected">
            <!-- 学习建议部分上移 -->
            <div class="suggestions-section improved-suggestions" v-if="assessmentResult.detailedFeedback && assessmentResult.detailedFeedback.length > 0">
              <h4><i class="el-icon-star-on suggestion-title-icon"></i>个性化学习建议</h4>
              <div class="suggestions-cards">
                <div v-for="(feedback, index) in filteredSuggestions" :key="index" class="suggestion-card">
                  <i class="el-icon-s-opportunity suggestion-icon"></i>
                  <p>{{ feedback }}</p>
                </div>
              </div>
            </div>
            
            <!-- 标记说明 -->
            <div class="analysis-legend">
              <h4>标记说明</h4>
              <div class="legend-items">
                <div class="legend-item">
                  <span class="legend-color word-good">示例</span>
                  <span class="legend-text">发音良好</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color word-medium-score">示例</span>
                  <span class="legend-text">发音一般</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color word-low-score">示例</span>
                  <span class="legend-text">发音较差</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color word-missed">示例</span>
                  <span class="legend-text">漏读</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color word-added">示例</span>
                  <span class="legend-text">增读</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color word-repeated">示例</span>
                  <span class="legend-text">回读</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color word-substituted">示例</span>
                  <span class="legend-text">替换</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color sil-mark">sil</span>
                  <span class="legend-text">静音/停顿</span>
                </div>
              </div>
              <div class="legend-explanation">
                <p><strong>注意：</strong>"sil" 表示静音或停顿，是语音评测系统检测到的朗读过程中的自然停顿。适当的停顿是正常的，但过多或过长的停顿可能影响流利度评分。</p>
              </div>
            </div>
            
            <div class="scrollable-content">
              <!-- 单词级别可视化 -->
              <div v-if="assessmentResult.wordAnalysis && assessmentResult.wordAnalysis.length > 0" class="word-analysis">
                <h4>朗读文本分析</h4>
                <div class="scrollable-section">
                  <div class="text-visualization">
                    <span 
                      v-for="(word, index) in assessmentResult.wordAnalysis" 
                      :key="index"
                      :class="getWordClass(word)"
                      @mouseover="showWordError(word)"
                      @mouseleave="hideWordError"
                    >
                      {{ word.content }}
                    </span>
                  </div>
                  <div v-if="currentWordError" class="word-error-tooltip">
                    <p><strong>{{ currentWordError.content }}</strong>: {{ translateErrorMessage(currentWordError) }}</p>
                  </div>
                </div>
              </div>
              
              <!-- 句子级别分析 -->
              <div class="sentence-analysis-section" v-if="sentenceAnalysisData && sentenceAnalysisData.length > 0">
                <h4>句子分析</h4>
                <div class="scrollable-section">
                  <el-table :data="sentenceAnalysisData" style="width: 100%" border>
                    <el-table-column prop="index" label="序号" width="60"></el-table-column>
                    <el-table-column prop="content" label="句子内容" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="accuracyScore" label="发音准确度" width="100">
                      <template slot-scope="scope">
                        <el-progress :percentage="scope.row.accuracyScore" :color="getScoreColor(scope.row.accuracyScore)"></el-progress>
                      </template>
                    </el-table-column>
                    <el-table-column prop="fluencyScore" label="流利度" width="100">
                      <template slot-scope="scope">
                        <el-progress :percentage="scope.row.fluencyScore" :color="getScoreColor(scope.row.fluencyScore)"></el-progress>
                      </template>
                    </el-table-column>
                    <el-table-column prop="standardScore" label="语调自然度" width="100">
                      <template slot-scope="scope">
                        <el-progress :percentage="scope.row.standardScore" :color="getScoreColor(scope.row.standardScore)"></el-progress>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
              
              <!-- 单词问题汇总 -->
              <div class="word-problems-section" v-if="wordProblemGroups && Object.keys(wordProblemGroups).length > 0">
                <h4>单词问题汇总</h4>
                <div class="scrollable-section">
                  <el-collapse>
                    <el-collapse-item v-for="(words, problemType) in wordProblemGroups" :key="problemType" :title="`${problemType}问题 (${words.length}个)`">
                      <el-tag 
                        v-for="(word, index) in words" 
                        :key="index" 
                        :type="getTagType(word.score)" 
                        effect="plain" 
                        class="word-tag"
                        @click="showWordDetail(word)">
                        {{ word.content }}
                      </el-tag>
                      <div v-if="selectedWord" class="word-detail">
                        <p><strong>{{ selectedWord.content }}</strong> - 得分: {{ selectedWord.score }}</p>
                        <p v-if="selectedWord.syllProblems && selectedWord.syllProblems.length > 0">
                          音节问题: 
                          <span v-for="(syll, idx) in selectedWord.syllProblems" :key="idx" class="syll-problem">
                            {{ syll.content }}{{ idx < selectedWord.syllProblems.length - 1 ? ', ' : '' }}
                          </span>
                        </p>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
              
              <!-- 详细评估反馈 -->
              <div class="detailed-feedback-section" v-if="false">
                <h4>详细评估反馈</h4>
                <div class="feedback-list">
                  <div v-for="(feedback, index) in assessmentResult.detailedFeedback" :key="index" class="feedback-item">
                    <p>{{ feedback }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="empty-analysis">
            <i class="el-icon-s-data empty-icon"></i>
            <p class="empty-text">完成评估后查看详细分析结果</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
// 引入CryptoJS库用于生成签名
import CryptoJS from 'crypto-js'

export default {
  name: 'AudioAssessment',
  data() {
    return {
      // API配置
      appId: 'f9b0da45',
      apiKey: '38ad8ca75614d9c3935db71f86e08357',
      apiSecret: 'YTlkYjU4MzA5ODg1ZjRiYjlmZDk0ZmUw',
      wsUrl: 'wss://ise-api.xfyun.cn/v2/open-ise',
      
      // 脚本相关
      presetScripts: [
        {
          id: 1,
          title: '英语口语练习 - 自我介绍',
          content: 'Hello, my name is Emily Chen. I am a student at Peking University. I am interested in artificial intelligence and data science. In my free time, I enjoy playing the piano and hiking in the mountains. I am learning English because it is essential for my future career in international research. My goal is to improve my speaking skills and communicate fluently with people from different countries.'
        },
        {
          id: 2,
          title: '英语口语练习 - 描述家乡',
          content: 'I would like to tell you about my hometown. I come from Hangzhou. It is located in eastern China, about 180 kilometers southwest of Shanghai. The city is known for its beautiful West Lake and historical sites. The weather there is usually mild with four distinct seasons. There are many interesting places to visit, such as Lingyin Temple, Leifeng Pagoda, and the tea plantations in the hills. The local food is delicious, especially the Dongpo Pork and West Lake Fish. What I love most about my hometown is the perfect balance between natural beauty and modern development.'
        },
        {
          id: 3,
          title: '英语口语练习 - 未来计划',
          content: 'In the future, I plan to become a software engineer specializing in machine learning. First, I want to complete my bachelor\'s degree with excellent grades. After that, I hope to pursue a master\'s degree in computer science at a university abroad. My long-term goal is to work for a leading technology company or start my own AI startup. To achieve these goals, I need to continuously improve my programming skills, build a strong professional network, and stay updated with the latest developments in technology. I believe that with hard work and determination, I can make my dreams come true.'
        },
        {
          id: 4,
          title: '英语口语练习 - 最喜欢的电影',
          content: 'My favorite movie is "The Shawshank Redemption". It was directed by Frank Darabont and released in 1994. The movie is about a banker named Andy Dufresne who is sentenced to life in Shawshank State Penitentiary for the murder of his wife and her lover, despite his claims of innocence. The main characters are played by Tim Robbins and Morgan Freeman. What I like most about this movie is its powerful message about hope and friendship. The scene that impressed me the most was when Andy played the beautiful opera music over the prison\'s loudspeakers. I would recommend this movie to anyone who enjoys thought-provoking dramas with deep emotional impact.'
        },
        {
          id: 5,
          title: '英语发音练习 - 元音和辅音',
          content: 'Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked. If Peter Piper picked a peck of pickled peppers, where\'s the peck of pickled peppers Peter Piper picked? She sells seashells by the seashore. The shells she sells are surely seashells. How much wood would a woodchuck chuck if a woodchuck could chuck wood? Betty bought a bit of better butter but the butter Betty bought was bitter, so Betty bought a better butter to make the bitter butter better.'
        }
      ],
      selectedPresetScript: null,
      customScript: '',
      wordCount: 0,
      maxWordCount: 1000,
      
      // 音频相关
      audioFile: null,
      audioUrl: '',
      isRecording: false,
      mediaRecorder: null,
      audioChunks: [],
      
      // WebSocket相关
      ws: null,
      isConnected: false,
      
      // 评估相关
      isAssessing: false,
      assessmentResult: null,
      assessmentFeedback: '',
      assessmentDetailedFeedback: [],
      isRejected: false,
      rejectionReason: '',
      wordAnalysis: [],
      pronunciationTips: [],
      currentWordError: null,
      
      // 错误处理
      errorMessage: '',
      
      // 当前使用的脚本
      currentScript: '',
      
      // 音频相关数据
      audioName: '',
      audioSize: '',
      assessmentProgress: 0,
      progressInterval: null,
      
      // 脚本相关数据
      activeScriptTab: 'preset',
      selectedScriptId: 1,
      customScriptContent: '',
      isWordCountExceeded: false,
      
      // 评估相关
      sentenceAnalysisData: [],
      wordProblemGroups: {},
      selectedWord: null, // 当前选中的单词详情
    }
  },
  computed: {
    selectedScript() {
      return this.presetScripts.find(script => script.id === this.selectedScriptId);
    },
    filteredSuggestions() {
      if (!this.assessmentResult || !this.assessmentResult.detailedFeedback) return [];
      // 只保留建议部分，过滤掉句子反馈、漏读问题等
      return this.assessmentResult.detailedFeedback.filter(feedback => 
        feedback.startsWith('建议') || 
        feedback.startsWith('继续练习') || 
        feedback.startsWith('您的发音已经很好')
      );
    }
  },
  methods: {
    // 音频相关方法
    handleAudioChange(file) {
      if (!file) return;
      
      // 检查文件类型
      const fileName = file.name.toLowerCase();
      const isValidFormat = fileName.endsWith('.wav') || fileName.endsWith('.pcm');
      
      if (!isValidFormat) {
        this.$message.error('请上传未压缩的PCM或WAV格式音频文件!');
        return;
      }
      
      // 检查文件大小，限制为10MB，避免过大的音频文件
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        this.$message.error('音频大小不能超过 10MB，请上传更小的文件!');
        return;
      }
      
      this.audioFile = file.raw;
      this.audioName = file.name;
      this.audioSize = this.formatFileSize(file.size);
      this.audioUrl = URL.createObjectURL(file.raw);
      
      // 读取音频文件内容
      const reader = new FileReader();
      reader.readAsArrayBuffer(this.audioFile);
      reader.onload = (e) => {
        // 获取原始音频数据
        const audioData = e.target.result;
        
        // 检查是否为WAV格式，如果是则需要去除头部
        if (fileName.endsWith('.wav')) {
          try {
            // WAV文件头通常为44字节
            // 检查文件头以确认是否为标准WAV格式
            const dataView = new DataView(audioData);
            const riffHeader = String.fromCharCode(dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2), dataView.getUint8(3));
            
            if (riffHeader === 'RIFF') {
              console.log('检测到WAV格式，去除文件头');
              // 查找数据块开始位置
              let offset = 12; // 跳过RIFF头和文件大小
              while (offset < 100) { // 设置一个合理的上限以防无限循环
                const chunkId = String.fromCharCode(
                  dataView.getUint8(offset),
                  dataView.getUint8(offset + 1),
                  dataView.getUint8(offset + 2),
                  dataView.getUint8(offset + 3)
                );
                
                if (chunkId === 'data') {
                  // 找到数据块，跳过块ID和块大小（8字节）
                  offset += 8;
                  console.log(`找到WAV数据块，数据开始位置: ${offset}`);
                  // 提取PCM数据
                  this.audioData = audioData.slice(offset);
                  return;
                }
                
                // 跳到下一个块
                const chunkSize = dataView.getUint32(offset + 4, true);
                offset += 8 + chunkSize;
              }
              
              // 如果没有找到data块，使用标准的44字节偏移
              console.warn('未找到WAV数据块，使用标准44字节偏移');
              this.audioData = audioData.slice(44);
            } else {
              console.warn('WAV文件头不符合标准格式，使用原始数据');
              this.audioData = audioData;
            }
          } catch (error) {
            console.error('处理WAV文件头时出错:', error);
            this.audioData = audioData;
          }
        } else {
          // PCM格式直接使用
          this.audioData = audioData;
        }
        
        console.log(`音频数据已加载，大小: ${this.audioData.byteLength} 字节`);
      };
      
      // 重置评估结果
      this.assessmentResult = null;
    },
    
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / 1024 / 1024).toFixed(2) + ' MB';
      }
    },
    
    // 讯飞API相关方法
    startAssessment() {
      if (!this.audioUrl) {
        this.$message.warning('请先上传音频文件');
        return;
      }
      
      // 检查是否有提交的脚本内容
      if (!this.currentScript) {
        // 如果没有提交脚本，使用当前选中的脚本
        if (this.activeScriptTab === 'preset' && this.selectedScript) {
          this.currentScript = this.selectedScript.content;
        } else if (this.activeScriptTab === 'custom' && this.customScriptContent.trim()) {
          if (this.isWordCountExceeded) {
            this.$message.warning('自定义脚本超过1000个单词限制，请减少内容后提交');
            return;
          }
          this.currentScript = this.customScriptContent;
        } else {
          this.$message.warning('请先提交脚本内容');
          return;
        }
      }
      
      this.isAssessing = true;
      this.assessmentProgress = 5;
      this.assessmentResult = null;
      
      // 连接WebSocket并开始评估
      this.connectWebSocket();
    },
    
    // 生成鉴权URL
    getAuthUrl() {
      const url = new URL(this.wsUrl);
      const host = url.host;
      const path = url.pathname;
      
      // 确保使用正确的当前时间，并输出日志以便调试
      const currentDate = new Date();
      console.log('当前系统时间:', currentDate);
      
      // 生成RFC1123格式的日期
      // 使用toUTCString确保格式符合RFC1123标准
      const date = currentDate.toUTCString();
      console.log('生成的UTC时间:', date);
      
      // 构建签名原始字段
      const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
      console.log('签名原始字段:', signatureOrigin);
      
      // 使用HMAC-SHA256算法计算签名
      const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.apiSecret);
      const signature = CryptoJS.enc.Base64.stringify(signatureSha);
      console.log('生成的签名:', signature);
      
      // 构建authorization_origin
      const authorizationOrigin = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
      console.log('authorization_origin:', authorizationOrigin);
      
      // Base64编码authorization
      const authorization = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin));
      console.log('Base64编码后的authorization:', authorization);
      
      // 构建完整的URL
      const authUrl = `${this.wsUrl}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
      console.log('生成的鉴权URL:', authUrl);
      
      return authUrl;
    },
    
    // 连接WebSocket
    connectWebSocket() {
      // 检查API配置是否完整
      if (!this.appId || !this.apiKey || !this.apiSecret) {
        console.error('API配置不完整，请检查appId、apiKey和apiSecret');
        this.$message.error('API配置不完整，请检查应用配置');
        this.resetAssessment();
        return;
      }
      
      try {
        const authUrl = this.getAuthUrl();
        
        if (this.ws) {
          this.ws.close();
        }
        
        console.log('正在连接WebSocket...');
        this.ws = new WebSocket(authUrl);
        
        // 连接建立时的回调
        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.sendStartFrame();
        };
        
        // 接收到消息的回调
        this.ws.onmessage = (e) => {
          this.handleWebSocketMessage(e.data);
        };
        
        // 连接关闭的回调
        this.ws.onclose = (e) => {
          console.log('WebSocket连接已关闭', e.code, e.reason);
          if (e.code !== 1000 && this.isAssessing) {
            // 非正常关闭且正在评估中
            this.$message.error(`连接已关闭: ${e.code} ${e.reason || '未知原因'}`);
            this.resetAssessment();
          }
        };
        
        // 连接出错的回调
        this.ws.onerror = (e) => {
          console.error('WebSocket连接出错:', e);
          this.$message.error('评测服务连接失败，可能是网络问题或API密钥已过期');
          this.resetAssessment();
        };
      } catch (error) {
        console.error('创建WebSocket连接时出错:', error);
        this.$message.error(`连接失败: ${error.message}`);
        this.resetAssessment();
      }
    },
    
    // 发送开始帧
    sendStartFrame() {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.$message.error('WebSocket连接未建立');
        return;
      }
      
      // 获取当前选中的脚本内容
      let text = '';
      if (this.activeScriptTab === 'preset') {
        text = this.selectedScript.content;
      } else {
        text = this.customScriptContent;
      }
      
      // 格式化文本
      const formattedText = this.formatText(text);
      console.log('格式化后的评测文本:', formattedText);
      
      // 构建开始帧
      const startFrame = {
        common: {
          app_id: this.appId
        },
        business: {
          sub: "ise", // 服务类型：开放评测
          ent: "en_vip", // 英文评测
          category: "read_chapter", // 英文篇章朗读
          text: formattedText, // 评测文本
          cmd: "ssb", // 参数上传阶段
          ttp_skip: true, // 跳过ttp直接使用text字段中的文本
          rst: "entirety", // 完整评测结果
          ise_unite: "1", // 控制返回结果
          extra_ability: "syll_phone_err_msg", // 音素错误信息显示
          aue: "raw", // 未压缩的pcm格式音频或wav
          auf: "audio/L16;rate=16000", // 音频采样率
          rstcd: "utf8" // 返回结果格式
        },
        data: {
          status: 0, // 开始帧
          format: "audio/L16;rate=16000" // 音频格式
        }
      };
      
      console.log('发送开始帧:', JSON.stringify(startFrame));
      
      // 发送开始帧
      this.ws.send(JSON.stringify(startFrame));
      this.handshakeSuccess = true;
      
      // 开始发送音频数据
      setTimeout(() => {
        this.sendAudioData();
      }, 500);
    },
    
    // 格式化文本
    formatText(text) {
      // 移除多余的空格和换行
      let formatted = text.trim().replace(/\s+/g, ' ');
      
      // 移除不支持的特殊字符
      formatted = formatted.replace(/[^\w\s.,?!'"()]/g, '');
      
      // 确保标点符号前后有适当的空格
      formatted = formatted.replace(/\s*([.,?!])\s*/g, '$1 ').replace(/\s+/g, ' ');
      
      // 确保文本不超过1000个单词
      const words = formatted.split(/\s+/);
      if (words.length > 1000) {
        formatted = words.slice(0, 1000).join(' ');
      }
      
      // 检查句子长度，确保每个句子不超过1024字节
      const sentences = formatted.split(/[.!?]+\s+/);
      const processedSentences = [];
      
      for (let sentence of sentences) {
        if (!sentence.trim()) continue;
        
        // 检查句子长度
        if (new TextEncoder().encode(sentence).length > 1000) {
          // 如果句子太长，尝试在适当的位置分割
          const words = sentence.split(' ');
          let currentSentence = '';
          
          for (let word of words) {
            const potentialSentence = currentSentence + ' ' + word;
            if (new TextEncoder().encode(potentialSentence).length > 900) {
              processedSentences.push(currentSentence.trim());
              currentSentence = word;
            } else {
              currentSentence = potentialSentence;
            }
          }
          
          if (currentSentence) {
            processedSentences.push(currentSentence.trim());
          }
        } else {
          processedSentences.push(sentence.trim());
        }
      }
      
      // 重新组合句子
      formatted = processedSentences.join('. ') + '.';
      
      // 添加[content]标记
      return '[content]' + formatted;
    },
    
    // 发送音频数据
    sendAudioData() {
      if (!this.audioData || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket未连接或音频数据不存在');
        return;
      }

      console.log(`准备发送音频数据，总大小: ${this.audioData.byteLength} 字节`);
      
      // 初始切片大小，后续会动态调整
      let initialSliceSize = 4000;
      // 目标Base64长度，稍微小于限制值以留出余量
      const targetBase64Length = 25000;
      // 最小切片大小
      const minSliceSize = 100;
      
      let offset = 0;
      const totalLength = this.audioData.byteLength;
      
      // 创建一个函数来处理和发送每个切片
      const sendNextSlice = () => {
        if (offset >= totalLength) {
          console.log('所有音频数据已发送，发送结束帧');
          this.sendEndFrame();
          return;
        }
        
        // 计算当前切片大小
        let currentSliceSize = Math.min(initialSliceSize, totalLength - offset);
        
        // 创建当前切片的Uint8Array视图
        const audioSlice = new Uint8Array(this.audioData, offset, currentSliceSize);
        
        // 将Uint8Array转换为Base64
        let base64Data = '';
        try {
          // 使用更可靠的方法进行Base64编码
          const binary = Array.from(audioSlice).map(byte => String.fromCharCode(byte)).join('');
          base64Data = window.btoa(binary);
          
          // 检查Base64编码后的长度
          if (base64Data.length > 26000) {
            console.warn(`Base64数据长度(${base64Data.length})超过限制，减小切片大小`);
            // 如果当前切片编码后超过限制，减小切片大小并重试
            currentSliceSize = Math.floor(currentSliceSize * (targetBase64Length / base64Data.length));
            if (currentSliceSize < minSliceSize) {
              console.error('切片大小已经非常小，无法继续减小');
              this.$message.error('音频数据处理失败，请尝试使用更小的音频文件');
              return;
            }
            
            // 重新创建切片并编码
            const smallerSlice = new Uint8Array(this.audioData, offset, currentSliceSize);
            const smallerBinary = Array.from(smallerSlice).map(byte => String.fromCharCode(byte)).join('');
            base64Data = window.btoa(smallerBinary);
            
            console.log(`重新调整后的切片大小: ${currentSliceSize}字节，Base64长度: ${base64Data.length}`);
          } else if (base64Data.length < targetBase64Length * 0.8 && currentSliceSize < totalLength - offset) {
            // 如果Base64长度远小于目标值，且还有更多数据可以发送，增加切片大小
            const newSliceSize = Math.min(
              Math.floor(currentSliceSize * (targetBase64Length / base64Data.length)),
              totalLength - offset
            );
            
            // 重新创建切片并编码
            const largerSlice = new Uint8Array(this.audioData, offset, newSliceSize);
            const largerBinary = Array.from(largerSlice).map(byte => String.fromCharCode(byte)).join('');
            const newBase64Data = window.btoa(largerBinary);
            
            // 只有当新的Base64长度不超过限制时才使用新的切片
            if (newBase64Data.length <= 26000) {
              currentSliceSize = newSliceSize;
              base64Data = newBase64Data;
              console.log(`增加切片大小: ${currentSliceSize}字节，Base64长度: ${base64Data.length}`);
            }
          }
          
          // 更新下一次切片的初始大小，使用当前成功的切片大小作为参考
          initialSliceSize = currentSliceSize;
        } catch (error) {
          console.error('Base64编码失败:', error);
          this.$message.error('音频数据编码失败，请检查音频格式');
          return;
        }
        
        // 确定当前切片的状态
        let aus = 2; // 中间帧
        if (offset === 0) {
          aus = 1; // 第一帧
        } else if (offset + currentSliceSize >= totalLength) {
          aus = 4; // 最后一帧
        }
        
        // 构建音频数据帧
        const audioFrame = {
          business: {
            cmd: "auw", // 音频上传阶段
            aus: aus
          },
          data: {
            status: 1, // 中间数据
            data: base64Data
          }
        };
        
        // 发送音频数据
        console.log(`发送音频切片: 偏移=${offset}, 大小=${currentSliceSize}字节, 状态=${aus}, Base64长度=${base64Data.length}`);
        this.ws.send(JSON.stringify(audioFrame));
        
        // 更新偏移量
        offset += currentSliceSize;
        
        // 更新进度
        const progress = Math.min(Math.round((offset / totalLength) * 90) + 5, 95);
        this.assessmentProgress = progress;
        
        // 使用setTimeout来避免阻塞UI线程，并控制发送速率
        setTimeout(sendNextSlice, 50);
      };
      
      // 开始发送第一个切片
      sendNextSlice();
    },
    
    // 发送结束帧
    sendEndFrame() {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      
      // 构建结束帧
      const endFrame = {
        business: {
          cmd: "auw", // 音频上传阶段
          aus: 4 // 最后一帧音频
        },
        data: {
          status: 2, // 结束帧
          data: "" // 空数据
        }
      };
      
      console.log('发送结束帧');
      
      // 发送结束帧
      this.ws.send(JSON.stringify(endFrame));
    },
    
    // 处理WebSocket消息
    handleWebSocketMessage(message) {
      try {
        console.log('收到WebSocket消息:', message);
        const response = JSON.parse(message);
        
        // 检查是否有错误码
        if (response.code !== 0) {
          console.error(`评测服务返回错误，错误码: ${response.code}, 错误信息: ${response.message}, sid: ${response.sid || '未知'}`);
          
          // 处理特定错误码
          if (response.code === 10163) {
            this.$message.error(`参数验证错误: ${response.message}`);
            this.isAssessing = false;
            return;
          } else if (response.code === 10105) {
            this.$message.error('评测文本格式错误，请检查文本内容');
            this.isAssessing = false;
            return;
          } else if (response.code === 11201) {
            this.$message.error('音频质量不佳，请在安静环境下录制清晰的音频');
            this.isAssessing = false;
            return;
          } else {
            this.$message.error(`评测失败，错误码: ${response.code}`);
            this.isAssessing = false;
            return;
          }
        }
        
        // 检查是否是最终结果
        if (response.data && response.data.status === 2) {
          console.log('收到最终评测结果');
          this.isAssessing = false;
          this.assessmentProgress = 100;
          
          // 解码base64数据
          const base64Result = response.data.data;
          if (base64Result) {
            try {
              // 解码base64字符串
              const decodedResult = atob(base64Result);
              console.log('解码后的XML结果:', decodedResult);
              
              // 解析XML结果
              const parseResult = this.parseAssessmentResult(decodedResult);
              
              if (parseResult.success) {
                // 更新评估结果
                this.assessmentResult = {
                  pronunciation: parseResult.pronunciation,
                  intonation: parseResult.intonation,
                  fluency: parseResult.fluency,
                  totalScore: parseResult.totalScore,
                  feedback: parseResult.feedback,
                  detailedFeedback: parseResult.detailedFeedback,
                  wordAnalysis: parseResult.wordAnalysis,
                  pronunciationTips: parseResult.pronunciationTips,
                  isRejected: parseResult.isRejected
                };
                
                // 如果评估成功且未被拒绝，处理句子和单词分析数据
                if (!parseResult.isRejected) {
                  // 获取XML文档
                  const parser = new DOMParser();
                  const xmlDoc = parser.parseFromString(decodedResult, 'text/xml');
                  
                  // 解析句子级别的评分和问题
                  const sentenceNodes = xmlDoc.querySelectorAll('sentence');
                  const sentenceFeedback = [];
                  
                  sentenceNodes.forEach((sentenceNode, index) => {
                    const content = sentenceNode.getAttribute('content') || '';
                    const accuracyScore = parseFloat(sentenceNode.getAttribute('accuracy_score') || '0');
                    const fluencyScore = parseFloat(sentenceNode.getAttribute('fluency_score') || '0');
                    const standardScore = parseFloat(sentenceNode.getAttribute('standard_score') || '0');
                    
                    sentenceFeedback.push({
                      index: index + 1,
                      content: content,
                      accuracyScore: accuracyScore,
                      fluencyScore: fluencyScore,
                      standardScore: standardScore,
                      feedback: this.generateSentenceFeedback(accuracyScore, fluencyScore, standardScore)
                    });
                  });
                  
                  // 处理句子分析数据
                  this.processSentenceAnalysisData(sentenceFeedback);
                  
                  // 解析单词级别的问题
                  const wordNodes = xmlDoc.querySelectorAll('word');
                  const wordFeedback = [];
                  const wordAnalysisWithSil = [];
                  
                  // 查找所有静音段标记
                  const silNodes = xmlDoc.querySelectorAll('sil');
                  console.log(`检测到 ${silNodes.length} 个静音段`);
                  
                  // 处理单词节点
                  wordNodes.forEach((wordNode) => {
                    const content = wordNode.getAttribute('content') || '';
                    const dpMessage = parseInt(wordNode.getAttribute('dp_message') || '0');
                    const totalScore = parseFloat(wordNode.getAttribute('total_score') || '0');
                    
                    // 检查音节级别的问题
                    const syllNodes = wordNode.querySelectorAll('syll');
                    const syllProblems = [];
                    
                    syllNodes.forEach((syllNode) => {
                      const syllContent = syllNode.getAttribute('content') || '';
                      const serrMsg = parseInt(syllNode.getAttribute('serr_msg') || '0');
                      const syllAccent = parseInt(syllNode.getAttribute('syll_accent') || '0');
                      
                      if (serrMsg === 1 || serrMsg === 2049 || serrMsg === 2048) {
                        syllProblems.push({
                          content: syllContent,
                          serrMsg: serrMsg,
                          isAccentError: serrMsg === 2049 || serrMsg === 2048,
                          needsAccent: syllAccent === 1
                        });
                      }
                    });
                    
                    // 添加到单词分析数组
                    wordAnalysisWithSil.push({
                      content: content + ' ',  // 添加空格以便显示
                      dpMessage: dpMessage,
                      score: totalScore,
                      syllProblems: syllProblems,
                      isSil: false
                    });
                    
                    // 检查单词是否有问题，添加到反馈
                    if (dpMessage !== 0 || totalScore < 50 || syllProblems.length > 0) {
                      const problemType = this.getWordProblemType(dpMessage);
                      
                      wordFeedback.push({
                        content: content,
                        problemType: problemType,
                        score: totalScore,
                        syllProblems: syllProblems
                      });
                    }
                  });
                  
                  // 如果有静音段，将其添加到分析数据中
                  if (silNodes.length > 0) {
                    // 在每个单词之间添加静音标记
                    // 注意：这是一个简化的处理方式，实际上应该根据时间戳来确定静音段的位置
                    const finalWordAnalysis = [];
                    
                    wordAnalysisWithSil.forEach((word, index) => {
                      finalWordAnalysis.push(word);
                      
                      // 在单词之间添加静音标记
                      if (index < wordAnalysisWithSil.length - 1) {
                        finalWordAnalysis.push({
                          content: 'sil ',
                          isSil: true,
                          score: 100,
                          dpMessage: 0,
                          syllProblems: []
                        });
                      }
                    });
                    
                    // 更新评估结果中的单词分析数据
                    this.assessmentResult.wordAnalysis = finalWordAnalysis;
                  } else {
                    // 如果没有检测到静音段，直接使用原始单词分析数据
                    this.assessmentResult.wordAnalysis = wordAnalysisWithSil;
                  }
                  
                  // 处理单词问题分组
                  this.processWordProblemGroups(wordFeedback);
                }
                
                console.log('解析后的评估结果:', this.assessmentResult);
              } else {
                this.$message.error(parseResult.message);
              }
            } catch (error) {
              console.error('解码base64结果时出错:', error);
              this.$message.error('解析评测结果时出错，请重试');
            }
          } else {
            console.error('未收到评测结果数据');
            this.$message.error('未收到评测结果数据，请重试');
          }
        }
      } catch (error) {
        console.error('处理WebSocket消息时出错:', error);
        this.$message.error('处理评测结果时出错，请重试');
        this.isAssessing = false;
      }
    },
    
    // 获取单词的CSS类
    getWordClass(word) {
      if (word.isSil) {
        return 'sil-mark'; // 静音标记
      } else if (word.dpMessage === 16) {
        return 'word-missed'; // 漏读
      } else if (word.dpMessage === 32) {
        return 'word-added'; // 增读
      } else if (word.dpMessage === 64) {
        return 'word-repeated'; // 回读
      } else if (word.dpMessage === 128) {
        return 'word-substituted'; // 替换
      } else if (word.syllProblems && word.syllProblems.length > 0) {
        return 'word-pronunciation-error'; // 发音问题
      } else if (word.score < 50) {
        return 'word-low-score'; // 低分
      } else if (word.score < 70) {
        return 'word-medium-score'; // 中等分数
      } else {
        return 'word-good'; // 良好
      }
    },
    
    // 显示单词错误提示
    showWordError(word) {
      if (!word.isSil && (word.dpMessage !== 0 || (word.syllProblems && word.syllProblems.length > 0) || word.score < 70)) {
        this.currentWordError = word;
      }
    },
    
    // 隐藏单词错误提示
    hideWordError() {
      this.currentWordError = null;
    },
    
    // 翻译错误信息
    translateErrorMessage(word) {
      if (word.isSil) {
        return '静音/停顿';
      } else if (word.dpMessage === 16) {
        return '漏读';
      } else if (word.dpMessage === 32) {
        return '增读';
      } else if (word.dpMessage === 64) {
        return '回读';
      } else if (word.dpMessage === 128) {
        return '替换';
      } else if (word.syllProblems && word.syllProblems.length > 0) {
        const syllables = word.syllProblems.map(s => s.content).join(', ');
        return `发音问题: ${syllables}`;
      } else if (word.score < 50) {
        return '发音不准确';
      } else if (word.score < 70) {
        return '发音需要改进';
      } else {
        return '发音良好';
      }
    },
    
    // 脚本相关方法
    selectScript(scriptId) {
      this.selectedScriptId = scriptId;
      console.log(`已选择脚本: ${scriptId}`);
    },
    
    checkWordCount() {
      // 计算单词数（按空格分隔）
      if (!this.customScriptContent.trim()) {
        this.wordCount = 0;
        this.isWordCountExceeded = false;
        return;
      }
      
      const words = this.customScriptContent.trim().split(/\s+/);
      this.wordCount = words.length;
      this.isWordCountExceeded = this.wordCount > 1000;
      
      if (this.isWordCountExceeded) {
        this.$message.warning('自定义脚本不能超过1000个单词');
      }
    },
    
    submitPresetScript() {
      if (!this.selectedScript) return;
      
      // 设置当前评测文本
      this.currentScript = this.selectedScript.content;
      this.$message.success('预设脚本已提交，可以开始评测');
    },
    
    submitCustomScript() {
      if (!this.customScriptContent.trim() || this.isWordCountExceeded) return;
      
      // 设置当前评测文本
      this.currentScript = this.customScriptContent.trim();
      this.$message.success('自定义脚本已提交，可以开始评测');
    },
    
    clearCustomScript() {
      this.customScriptContent = '';
      this.wordCount = 0;
      this.isWordCountExceeded = false;
    },
    
    // 重置评估
    resetAssessment() {
      clearInterval(this.progressInterval);
      this.isAssessing = false;
      this.assessmentProgress = 0;
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.handshakeSuccess = false;
    },
    
    resetAudio() {
      if (this.audioUrl) {
        URL.revokeObjectURL(this.audioUrl);
      }
      
      this.audioUrl = '';
      this.audioFile = null;
      this.audioName = '';
      this.audioSize = '';
      this.audioData = null;
      this.assessmentResult = null;
      
      // 重置分析数据
      this.sentenceAnalysisData = [];
      this.wordProblemGroups = {};
      this.selectedWord = null;
      this.currentWordError = null;
      
      this.resetAssessment();
    },
    
    progressFormat(percentage) {
      return percentage === 100 ? '完成' : `${percentage}%`;
    },
    
    // 获取分数对应的颜色
    getScoreColor(score) {
      if (score >= 80) {
        return '#67c23a'; // 绿色
      } else if (score >= 60) {
        return '#e6a23c'; // 黄色
      } else {
        return '#f56c6c'; // 红色
      }
    },
    
    // 获取标签类型
    getTagType(score) {
      if (score >= 80) {
        return 'success';
      } else if (score >= 60) {
        return 'warning';
      } else {
        return 'danger';
      }
    },
    
    // 显示单词详情
    showWordDetail(word) {
      this.selectedWord = word;
    },
    
    // 处理句子分析数据
    processSentenceAnalysisData(sentenceFeedback) {
      // 将句子反馈数据转换为表格数据
      this.sentenceAnalysisData = sentenceFeedback.map(sentence => ({
        index: sentence.index,
        content: sentence.content,
        accuracyScore: sentence.accuracyScore,
        fluencyScore: sentence.fluencyScore,
        standardScore: sentence.standardScore,
        feedback: sentence.feedback
      }));
    },
    
    // 处理单词问题分组
    processWordProblemGroups(wordFeedback) {
      // 按问题类型分组单词问题
      this.wordProblemGroups = {};
      wordFeedback.forEach(word => {
        if (!this.wordProblemGroups[word.problemType]) {
          this.wordProblemGroups[word.problemType] = [];
        }
        this.wordProblemGroups[word.problemType].push(word);
      });
    },
    
    // 获取单词问题类型
    getWordProblemType(dpMessage) {
      switch (dpMessage) {
        case 16:
          return '漏读';
        case 32:
          return '增读';
        case 64:
          return '回读';
        case 128:
          return '替换';
        default:
          return '发音问题';
      }
    },
    
    // 生成句子级别的反馈
    generateSentenceFeedback(accuracyScore, fluencyScore, standardScore) {
      let feedback = '';
      
      if (accuracyScore < 60) {
        feedback += '发音准确度较低，请注意单词的正确发音；';
      } else if (accuracyScore < 80) {
        feedback += '发音基本准确，但仍有改进空间；';
      }
      
      if (fluencyScore < 60) {
        feedback += '流利度较低，朗读时请保持自然的语速和节奏；';
      } else if (fluencyScore < 80) {
        feedback += '流利度一般，可以通过更多练习提高；';
      }
      
      if (standardScore < 60) {
        feedback += '语调不够自然，请注意语句的重音和语调变化。';
      } else if (standardScore < 80) {
        feedback += '语调基本自然，但可以更加注重语句的抑扬顿挫。';
      }
      
      return feedback || '整体表现良好，继续保持。';
    },
    
    // 解析评估结果
    parseAssessmentResult(xmlResult) {
      try {
        console.log('解析评估结果XML:', xmlResult);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlResult, 'text/xml');
        
        // 获取总体评分节点
        const readChapterNode = xmlDoc.querySelector('read_chapter');
        const recPaperNode = xmlDoc.querySelector('rec_paper');
        
        if (!readChapterNode && !recPaperNode) {
          console.error('未找到评分节点');
          return {
            success: false,
            message: '解析评估结果失败：未找到评分节点'
          };
        }
        
        // 确定结果节点类型
        const resultNode = readChapterNode || recPaperNode;
        const isReadChapter = !!readChapterNode;
        
        // 检查是否被拒绝评测
        const isRejected = resultNode.getAttribute('is_rejected') === 'true';
        const exceptInfo = parseInt(resultNode.getAttribute('except_info') || '0');
        
        // 如果被拒绝，提供相应的反馈
        if (isRejected) {
          let rejectReason = '评测被拒绝';
          let detailedReason = '';
          
          if (exceptInfo === 28673) {
            rejectReason = '无语音或音量过小';
            detailedReason = '系统无法检测到有效的语音输入，或者音量太小。请确保麦克风正常工作并调整音量。';
          } else if (exceptInfo === 28676) {
            rejectReason = '检测到乱读';
            detailedReason = '系统检测到朗读内容与文本不匹配。请确保按照提供的文本准确朗读，不要添加、省略或替换单词。';
          } else if (exceptInfo === 28680) {
            rejectReason = '信噪比低';
            detailedReason = '背景噪音过大。请在安静的环境中重新录音，减少背景噪音干扰。';
          } else if (exceptInfo === 28690) {
            rejectReason = '音频截幅';
            detailedReason = '音频音量过大导致信号失真。请调低麦克风音量或与麦克风保持适当距离后重新录音。';
          } else if (exceptInfo === 28689) {
            rejectReason = '没有音频输入';
            detailedReason = '系统未接收到任何音频数据。请检查麦克风设备是否正常连接并授权使用。';
          }
          
          console.log(`评测被拒绝，原因: ${rejectReason}，错误码: ${exceptInfo}`);
          
          return {
            success: true,
            pronunciation: 1,
            fluency: 1,
            intonation: 1,
            totalScore: 20,
            feedback: `评测未成功：${rejectReason}`,
            detailedFeedback: [detailedReason],
            isRejected: true,
            rejectCode: exceptInfo
          };
        }
        
        // 获取总体评分
        let totalScore = 0;
        let pronunciationScore = 0; // accuracy_score
        let fluencyScore = 0;
        let integrityScore = 0;
        let standardScore = 0; // 标准度分，用于intonation
        
        // 从节点获取分数
        if (isReadChapter) {
          // 从read_chapter节点获取分数
          pronunciationScore = parseFloat(readChapterNode.getAttribute('accuracy_score') || '0');
          fluencyScore = parseFloat(readChapterNode.getAttribute('fluency_score') || '0');
          integrityScore = parseFloat(readChapterNode.getAttribute('integrity_score') || '0');
          standardScore = parseFloat(readChapterNode.getAttribute('standard_score') || '0');
          totalScore = parseFloat(readChapterNode.getAttribute('total_score') || '0');
          
          // 如果没有total_score，根据公式计算
          if (!totalScore) {
            // 成人篇章总分 = (0.5*accuracy_score + fluency_score*0.3 + standard_score*0.2)* integrity_score/100
            totalScore = (0.5 * pronunciationScore + 0.3 * fluencyScore + 0.2 * standardScore) * (integrityScore / 100);
          }
          
          console.log(`从read_chapter提取的原始分数: 发音=${pronunciationScore}, 流利=${fluencyScore}, 完整=${integrityScore}, 标准=${standardScore}, 总分=${totalScore}`);
        } else {
          // 从rec_paper节点获取分数
          pronunciationScore = parseFloat(recPaperNode.getAttribute('pronunciation') || '0');
          fluencyScore = parseFloat(recPaperNode.getAttribute('fluency') || '0');
          integrityScore = parseFloat(recPaperNode.getAttribute('integrity') || '0');
          standardScore = parseFloat(recPaperNode.getAttribute('tone') || '0');
          totalScore = parseFloat(recPaperNode.getAttribute('total_score') || '0');
          
          console.log(`从rec_paper提取的原始分数: 发音=${pronunciationScore}, 流利=${fluencyScore}, 完整=${integrityScore}, 标准=${standardScore}, 总分=${totalScore}`);
        }
        
        // 将分数转换为1-5星级
        const pronunciationStars = Math.max(1, Math.min(5, Math.round(pronunciationScore / 20)));
        const fluencyStars = Math.max(1, Math.min(5, Math.round(fluencyScore / 20)));
        const intonationStars = Math.max(1, Math.min(5, Math.round(standardScore / 20)));
        
        // 确保总分在0-100之间
        totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
        
        // 解析句子级别的评分和问题
        const sentenceNodes = xmlDoc.querySelectorAll('sentence');
        const sentenceFeedback = [];
        
        sentenceNodes.forEach((sentenceNode, index) => {
          const content = sentenceNode.getAttribute('content') || '';
          const accuracyScore = parseFloat(sentenceNode.getAttribute('accuracy_score') || '0');
          const fluencyScore = parseFloat(sentenceNode.getAttribute('fluency_score') || '0');
          const standardScore = parseFloat(sentenceNode.getAttribute('standard_score') || '0');
          
          // 只有当分数较低时才添加到反馈中
          if (accuracyScore < 70 || fluencyScore < 70 || standardScore < 70) {
            sentenceFeedback.push({
              index: index + 1,
              content: content,
              accuracyScore: accuracyScore,
              fluencyScore: fluencyScore,
              standardScore: standardScore,
              feedback: this.generateSentenceFeedback(accuracyScore, fluencyScore, standardScore)
            });
          }
        });
        
        // 解析单词级别的问题
        const wordNodes = xmlDoc.querySelectorAll('word');
        const wordFeedback = [];
        const wordAnalysis = [];
        
        wordNodes.forEach((wordNode) => {
          const content = wordNode.getAttribute('content') || '';
          const dpMessage = parseInt(wordNode.getAttribute('dp_message') || '0');
          const totalScore = parseFloat(wordNode.getAttribute('total_score') || '0');
          
          const wordData = {
            content: content + ' ',  // 添加空格以便显示
            dpMessage: dpMessage,
            score: totalScore,
            syllProblems: []
          };
          
          // 检查音节级别的问题
          const syllNodes = wordNode.querySelectorAll('syll');
          
          syllNodes.forEach((syllNode) => {
            const syllContent = syllNode.getAttribute('content') || '';
            const serrMsg = parseInt(syllNode.getAttribute('serr_msg') || '0');
            const syllAccent = parseInt(syllNode.getAttribute('syll_accent') || '0');
            
            if (serrMsg === 1 || serrMsg === 2049 || serrMsg === 2048) {
              wordData.syllProblems.push({
                content: syllContent,
                serrMsg: serrMsg,
                isAccentError: serrMsg === 2049 || serrMsg === 2048,
                needsAccent: syllAccent === 1
              });
            }
          });
          
          wordAnalysis.push(wordData);
          
          // 检查单词是否有问题，添加到反馈
          if (dpMessage !== 0 || totalScore < 50 || wordData.syllProblems.length > 0) {
            const problemType = this.getWordProblemType(dpMessage);
            
            wordFeedback.push({
              content: content,
              problemType: problemType,
              score: totalScore,
              syllProblems: wordData.syllProblems
            });
          }
        });
        
        // 生成详细反馈
        const detailedFeedback = this.generateDetailedFeedback(totalScore, sentenceFeedback, wordFeedback);
        
        // 生成发音建议
        const pronunciationTips = this.generatePronunciationTips(wordFeedback, totalScore);
        
        // 生成总体反馈
        let generalFeedback = '';
        if (totalScore >= 90) {
          generalFeedback = '您的英语口语表现优秀！发音清晰，语调自然，流利度高。';
        } else if (totalScore >= 80) {
          generalFeedback = '您的英语口语表现很好！发音基本清晰，语调较为自然，流利度良好。';
        } else if (totalScore >= 70) {
          generalFeedback = '您的英语口语表现良好，但仍有提升空间。建议关注发音准确性和语调自然度。';
        } else if (totalScore >= 60) {
          generalFeedback = '您的英语口语表现一般，需要更多练习。建议重点关注发音问题和流利度。';
        } else {
          generalFeedback = '您的英语口语需要大量练习。建议从基础发音开始，逐步提高流利度和语调。';
        }
        
        return {
          success: true,
          pronunciation: pronunciationStars,
          fluency: fluencyStars,
          intonation: intonationStars,
          totalScore: totalScore,
          feedback: generalFeedback,
          detailedFeedback: detailedFeedback,
          wordAnalysis: wordAnalysis,
          pronunciationTips: pronunciationTips,
          isRejected: false
        };
      } catch (error) {
        console.error('解析评估结果出错:', error);
        return {
          success: false,
          message: '解析评估结果失败：' + error.message
        };
      }
    },
    
    // 生成详细反馈
    generateDetailedFeedback(totalScore, sentenceFeedback, wordFeedback) {
      const detailedFeedback = [];
      
      // 添加句子级别的反馈
      if (sentenceFeedback.length > 0) {
        sentenceFeedback.forEach(sentence => {
          detailedFeedback.push(`句子 ${sentence.index}："${this.truncateText(sentence.content, 30)}" - ${sentence.feedback}`);
        });
      }
      
      // 添加单词级别的反馈
      if (wordFeedback.length > 0) {
        // 按问题类型分组
        const problemGroups = {};
        
        wordFeedback.forEach(word => {
          if (!problemGroups[word.problemType]) {
            problemGroups[word.problemType] = [];
          }
          problemGroups[word.problemType].push(word);
        });
        
        // 生成每种问题类型的反馈
        Object.keys(problemGroups).forEach(problemType => {
          const words = problemGroups[problemType];
          if (words.length > 0) {
            const wordList = words.map(w => w.content).join('、');
            detailedFeedback.push(`${problemType}问题：${this.truncateText(wordList, 50)}`);
            
            // 添加音节级别的问题
            words.forEach(word => {
              if (word.syllProblems && word.syllProblems.length > 0) {
                const syllList = word.syllProblems.map(s => s.content).join('、');
                detailedFeedback.push(`  "${word.content}" 中的音节问题：${syllList}`);
              }
            });
          }
        });
      }
      
      // 根据总分添加一般性建议
      if (totalScore < 60) {
        detailedFeedback.push('建议：多听英语音频，模仿标准发音，注意单词的重音和句子的语调。');
        detailedFeedback.push('可以使用英语发音应用或查看在线发音词典，学习正确的发音方式。');
        detailedFeedback.push('尝试跟读英语材料，从简单的句子开始，逐渐增加难度。');
      } else if (totalScore < 80) {
        detailedFeedback.push('继续练习，关注朗读的流利度和自然度，注意语句间的连贯性。');
        detailedFeedback.push('尝试录制自己的朗读并与标准发音比较，找出需要改进的地方。');
      } else {
        detailedFeedback.push('您的发音已经很好，继续保持并尝试更复杂的材料来提高。');
      }
      
      return detailedFeedback;
    },
    
    // 生成发音建议
    generatePronunciationTips(wordFeedback, totalScore) {
      const tips = [];
      
      // 根据单词问题生成建议
      const problemTypes = {};
      wordFeedback.forEach(word => {
        if (!problemTypes[word.problemType]) {
          problemTypes[word.problemType] = [];
        }
        problemTypes[word.problemType].push(word);
      });
      
      // 漏读问题
      if (problemTypes['漏读'] && problemTypes['漏读'].length > 0) {
        tips.push('注意不要漏读单词，确保朗读所有文本内容。');
      }
      
      // 增读问题
      if (problemTypes['增读'] && problemTypes['增读'].length > 0) {
        tips.push('避免增读不存在的单词，仔细阅读文本内容。');
      }
      
      // 回读问题
      if (problemTypes['回读'] && problemTypes['回读'].length > 0) {
        tips.push('尽量避免重复朗读同一单词，保持流畅的语速。');
      }
      
      // 替换问题
      if (problemTypes['替换'] && problemTypes['替换'].length > 0) {
        tips.push('注意准确朗读单词，不要用其他单词替换原文。');
      }
      
      // 发音问题
      if (problemTypes['发音问题'] && problemTypes['发音问题'].length > 0) {
        tips.push('关注单词的正确发音，特别是元音和辅音的区别。');
        
        // 检查是否有音节问题
        let hasSyllableProblems = false;
        problemTypes['发音问题'].forEach(word => {
          if (word.syllProblems && word.syllProblems.length > 0) {
            hasSyllableProblems = true;
          }
        });
        
        if (hasSyllableProblems) {
          tips.push('注意单词中的音节发音，尤其是重音音节。');
        }
      }
      
      // 根据总分添加一般性建议
      if (totalScore < 60) {
        tips.push('建议多听英语音频，模仿标准发音，注意单词的重音和句子的语调。');
        tips.push('可以使用英语发音应用或查看在线发音词典，学习正确的发音方式。');
        tips.push('尝试跟读英语材料，从简单的句子开始，逐渐增加难度。');
      } else if (totalScore < 80) {
        tips.push('继续练习，关注朗读的流利度和自然度，注意语句间的连贯性。');
        tips.push('尝试录制自己的朗读并与标准发音比较，找出需要改进的地方。');
      } else {
        tips.push('您的发音已经很好，继续保持并尝试更复杂的材料来提高。');
      }
      
      return tips;
    },
    
    // 截断文本，避免过长
    truncateText(text, maxLength) {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
  }
}
</script>

<style scoped>
.audio-assessment-container {
  padding: 20px;
  height: 100%;
  background-color: #f5f7fa;
}

.card-container {
  max-width: 1800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 20px;
  grid-auto-flow: row dense;
  align-items: stretch;
}

@media (max-width: 1200px) {
  .card-container {
    grid-template-columns: 1fr;
  }
}

.card-title {
  font-size: 18px;
  font-weight: bold;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 单纯设置评估结果和详细分析卡片的统一高度 */
.result-card, .analysis-card {
  height: 600px !important; /* 增加高度，保持两者对称 */
}

/* 确保卡片内容能够滚动显示全部内容 */
.result-card .content, .analysis-card .content {
  flex: 1;
  overflow: auto;
}

/* 单词分析样式 */
.word-analysis {
  margin-bottom: 20px;
}

.text-visualization {
  line-height: 1.8;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 10px;
}

.text-visualization span {
  display: inline-block;
  padding: 2px 4px;
  margin: 2px;
  border-radius: 3px;
  cursor: pointer;
}

.word-good {
  color: #67c23a;
}

.word-medium-score {
  color: #e6a23c;
}

.word-low-score {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

.word-missed {
  color: #f56c6c;
  text-decoration: line-through;
  background-color: rgba(245, 108, 108, 0.1);
}

.word-added {
  color: #409eff;
  border-bottom: 1px dashed #409eff;
}

.word-repeated {
  color: #e6a23c;
  font-style: italic;
}

.word-substituted {
  color: #f56c6c;
  font-weight: bold;
  text-decoration: underline;
}

.word-pronunciation-error {
  color: #f56c6c;
  border-bottom: 2px solid #f56c6c;
}

.sil-mark {
  color: #909399;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-style: italic;
  font-size: 0.9em;
}

.word-error-tooltip {
  padding: 10px;
  background-color: #f9f9f9;
  border-left: 3px solid #f56c6c;
  margin-bottom: 15px;
}

.analysis-legend {
  margin-bottom: 15px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.legend-color {
  display: inline-block;
  padding: 2px 6px;
  margin-right: 5px;
  border-radius: 3px;
}

.legend-text {
  font-size: 14px;
}

.legend-explanation {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.rejection-explanation {
  margin-top: 15px;
  padding: 15px;
  background-color: #fef0f0;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 14px;
  line-height: 1.5;
}

/* 脚本样式 */
.script-card, .upload-card, .result-card, .analysis-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

/* 单独设置评估结果和详细分析卡片的高度 */
.result-card, .analysis-card {
  height: 1400px !important;
}

/* 单独设置脚本卡片和上传卡片的高度 */
.script-card, .upload-card {
  height: 450px !important;
}

/* 卡片内容区域 */
.script-card .content, .upload-card .content, .result-card .content, .analysis-card .content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 确保整体内容区域不滚动 */
}

/* 详细分析中的可滚动区域 */
.scrollable-section {
  height: 200px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #f9f9f9;
  margin-bottom: 15px;
}

/* 建议卡片区域 - 不滚动 */
.suggestions-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
  overflow: visible;
  padding: 5px;
}

/* 评估结果和发音建议 - 不滚动 */
.result-feedback, .pronunciation-tips {
  max-height: 200px;
  overflow-y: auto;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.result-feedback {
  background: linear-gradient(145deg, #f9fbff, #e6f4ff);
  border-left: 4px solid #409EFF;
}

.pronunciation-tips {
  background: linear-gradient(145deg, #f9fff9, #e6fff0);
  border-left: 4px solid #67C23A;
}

.result-feedback h4, .pronunciation-tips h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.result-feedback h4:before {
  content: "\e6a3";
  font-family: element-icons !important;
  margin-right: 8px;
  color: #409EFF;
}

.pronunciation-tips h4:before {
  content: "\e6ce";
  font-family: element-icons !important;
  margin-right: 8px;
  color: #67C23A;
}

.result-feedback p {
  line-height: 1.6;
  color: #505356;
  margin: 0;
}

.pronunciation-tips ul {
  padding-left: 20px;
  margin: 0;
}

.pronunciation-tips li {
  line-height: 1.6;
  color: #505356;
  margin-bottom: 8px;
  position: relative;
}

.pronunciation-tips li:last-child {
  margin-bottom: 0;
}

.result-feedback:hover, .pronunciation-tips:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.word-count {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.word-count-warning {
  color: #E6A23C;
  font-weight: bold;
}

/* 音频上传样式 */
.upload-card {
  height: 450px;
  display: flex;
  flex-direction: column;
}

.upload-card .content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.upload-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.audio-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 60px;
  height: 60px;
  line-height: 60px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.upload-text {
  margin-top: 10px;
  color: #606266;
}

.upload-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.audio-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.audio-preview audio {
  width: 100%;
  max-width: 500px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 500px;
  color: #606266;
  font-size: 14px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
}

.assessment-progress {
  margin: 20px 0;
}

.progress-text {
  text-align: center;
  margin-top: 10px;
  color: #606266;
}

/* 新增样式 */
.empty-result, .empty-analysis {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #dcdfe6;
}

.empty-text {
  font-size: 16px;
}

.suggestions-section {
  margin-top: 20px;
}

.suggestion-card {
  flex: 1;
  min-width: 200px;
  padding: 15px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border-left: 3px solid #67c23a;
  display: flex;
  align-items: flex-start;
}

.suggestion-icon {
  font-size: 20px;
  color: #67c23a;
  margin-right: 10px;
  margin-top: 2px;
}

.suggestion-card p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.text-visualization-container {
  line-height: 1.8;
}

.text-visualization {
  line-height: 1.8;
}

.detailed-feedback-section {
  display: block;
}

.word-analysis,
.sentence-analysis-section,
.word-problems-section {
  margin-bottom: 20px;
}

.analysis-card {
  height: 550px;
  display: flex;
  flex-direction: column;
}

.analysis-card .content {
  flex: 1;
  overflow: hidden;
  padding-right: 5px;
}

.analysis-legend {
  margin-bottom: 15px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.scrollable-section {
  margin-bottom: 20px;
}

.text-visualization-container {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.sentence-analysis-section {
  margin-bottom: 20px;
}

.word-problems-section {
  margin-bottom: 20px;
}

.suggestions-section {
  margin-bottom: 20px;
}

.word-detail {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.word-detail p {
  margin: 0;
  color: #606266;
}

.syll-problem {
  color: #f56c6c;
  font-size: 14px;
}

.result-card .content {
  flex: 1;
  overflow: hidden;
}

.analysis-card .content {
  flex: 1;
  overflow: hidden;
}

.script-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.custom-script .el-textarea {
  flex: 1;
}

/* 详细分析中的可滚动内容容器 */
.scrollable-content {
  display: block;
  height: auto;
  overflow: visible;
  border: none;
  padding: 0;
  background-color: transparent;
  margin-bottom: 20px;
}

/* 详细分析中的各个部分 */
.word-analysis,
.sentence-analysis-section,
.word-problems-section {
  margin-bottom: 20px;
}
/* 确保详细分析卡片中的表格可以正常显示 */
.scrollable-section .el-table {
  width: 100%;
  margin-bottom: 0;
}

/* 脚本内容 */
.script-content {
  flex: 1;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
  height: 180px; /* 调整固定高度 */
  overflow-y: auto;
  margin-bottom: 10px;
}

/* 预设脚本列表 */
.preset-scripts {
  margin-bottom: 10px;
  height: 90px; /* 减小高度，给script-content留出更多空间 */
  overflow-y: auto;
}

/* 固定脚本卡片高度 */
.script-card {
  height: 450px !important; /* 与upload-card一致的高度 */
}

/* 确保tab内容区域高度一致 */
.el-tabs__content {
  height: 330px;
  overflow: hidden; /* 改为hidden，让内部元素控制滚动 */
}

/* 确保两种类型的脚本区域高度一致 */
.preset-scripts {
  margin-bottom: 10px;
  height: 90px; /* 减小高度，给script-content留出更多空间 */
  overflow-y: auto;
}

.custom-script {
  height: 280px;
  display: flex;
  flex-direction: column;
}

.custom-script .el-textarea {
  flex: 1;
  margin-bottom: 10px;
}

.custom-script .el-textarea .el-textarea__inner {
  height: 210px !important; /* 固定文本域高度 */
  resize: none; /* 禁止用户调整大小 */
}

.script-actions {
  margin-top: 5px;
  display: flex;
  justify-content: flex-end;
}

/* 将提交按钮固定在右下角 */
.fixed-script-actions {
  position: absolute;
  bottom: 15px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 调整脚本内容区域，为固定按钮腾出空间 */
.script-content {
  flex: 1;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
  height: 180px;
  overflow-y: auto;
  margin-bottom: 40px; /* 增加底部间距，为固定按钮留出空间 */
}

.custom-script {
  height: 240px; /* 减小高度，为固定按钮留出空间 */
  display: flex;
  flex-direction: column;
  margin-bottom: 40px; /* 增加底部间距 */
}

.custom-script .el-textarea .el-textarea__inner {
  height: 170px !important; /* 减小高度 */
  resize: none;
}

/* 移除原来的脚本操作区域样式 */
.script-actions {
  display: none;
}

/* 预设脚本的按钮固定在右下角 */
.preset-script-fixed-action {
  position: absolute;
  bottom: 5px;
  right: 20px;
  z-index: 10;
}

/* 调整脚本内容区域，为固定按钮腾出空间 */
.script-content {
  flex: 1;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
  height: 180px;
  overflow-y: auto;
  margin-bottom: 40px; /* 增加底部间距，为固定按钮留出空间 */
}

/* 恢复原来的脚本操作区域样式 */
.script-actions {
  margin-top: 5px;
  display: flex;
  justify-content: flex-end;
}

.suggestions-section.improved-suggestions {
  margin: 0 0 25px 0;
  background: linear-gradient(to right, #f0f8ff, #f9fcff);
  padding: 15px 20px;
  border-radius: 10px;
  border-left: 4px solid #409EFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.improved-suggestions h4 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
}

.suggestion-title-icon {
  color: #409EFF;
  margin-right: 10px;
  font-size: 20px;
}

.improved-suggestions .suggestions-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.improved-suggestions .suggestion-card {
  flex: 1;
  min-width: 250px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #409EFF;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.improved-suggestions .suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.improved-suggestions .suggestion-icon {
  font-size: 18px;
  color: #409EFF;
  margin-right: 10px;
  margin-top: 2px;
}

.improved-suggestions .suggestion-card p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
  font-size: 14px;
}

/* 主题训练左右布局样式 */
.preset-scripts-container {
  display: flex;
  margin-bottom: 40px; /* 为固定按钮留出空间 */
  height: 250px;
}

.preset-scripts-menu {
  width: 30%;
  border-right: 1px solid #dcdfe6;
  padding-right: 15px;
  overflow-y: auto;
}

.script-content-area {
  width: 70%;
  padding-left: 15px;
  display: flex;
  flex-direction: column;
}

.script-item {
  margin-bottom: 10px;
}

.script-select-button {
  width: 100%;
  text-align: left;
  padding: 10px;
}

.script-content {
  flex: 1;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
  overflow-y: auto;
  height: auto;
  margin-bottom: 0;
}

.no-content-selected {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-style: italic;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}
</style>

