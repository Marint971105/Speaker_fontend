// Advanced Analysis Engine for IELTS Speaking
class AdvancedAnalysisEngine {
    constructor() {
        // IELTS评分标准
        this.scoringCriteria = {
            fluency: {
                9: { wpm: 160, hesitation: 0, repetition: 0 },
                8: { wpm: 150, hesitation: 1, repetition: 1 },
                7: { wpm: 140, hesitation: 2, repetition: 2 },
                6: { wpm: 120, hesitation: 3, repetition: 3 },
                5: { wpm: 100, hesitation: 4, repetition: 4 }
            },
            vocabulary: {
                9: { uniqueRatio: 0.8, advancedWords: 15, idioms: 3 },
                8: { uniqueRatio: 0.75, advancedWords: 12, idioms: 2 },
                7: { uniqueRatio: 0.7, advancedWords: 10, idioms: 1 },
                6: { uniqueRatio: 0.6, advancedWords: 7, idioms: 0 },
                5: { uniqueRatio: 0.5, advancedWords: 5, idioms: 0 }
            }
        };

        // 高级词汇库
        this.advancedVocabulary = [
            'consequently', 'furthermore', 'nevertheless', 'substantial', 'comprehensive',
            'sophisticated', 'innovative', 'prominent', 'significant', 'remarkable',
            'exceptional', 'tremendous', 'fascinating', 'compelling', 'intriguing',
            'elaborate', 'intricate', 'diverse', 'versatile', 'distinctive'
        ];

        // 常见语法错误模式
        this.grammarPatterns = {
            subjectVerbAgreement: /\b(he|she|it)\s+(are|have)\b/gi,
            articleErrors: /\b(a)\s+[aeiou]/gi,
            prepositionErrors: /\b(in)\s+(the)\s+(morning|afternoon|evening)\b/gi
        };

        // 连接词和过渡词
        this.connectiveWords = [
            'however', 'moreover', 'furthermore', 'therefore', 'consequently',
            'in addition', 'on the other hand', 'for instance', 'in particular',
            'as a result', 'in conclusion', 'to summarize'
        ];
    }

    // 深度分析录音
    async analyzeRecordingAdvanced(speechStats, questionType, category) {
        const analysis = {
            overall: 0,
            detailedScores: {},
            strengths: [],
            weaknesses: [],
            specificFeedback: {},
            improvementPlan: {},
            bandDescriptors: {},
            progressTracking: {}
        };

        // 详细的四项评分
        analysis.detailedScores = {
            fluency: this.analyzeFluencyAdvanced(speechStats),
            vocabulary: this.analyzeVocabularyAdvanced(speechStats),
            grammar: this.analyzeGrammarAdvanced(speechStats),
            pronunciation: this.analyzePronunciationAdvanced(speechStats)
        };

        // 计算总分
        analysis.overall = this.calculateOverallScore(analysis.detailedScores);

        // 生成具体反馈
        analysis.specificFeedback = this.generateSpecificFeedback(analysis.detailedScores, questionType);

        // 生成改进计划
        analysis.improvementPlan = this.generateImprovementPlan(analysis.detailedScores, category);

        // 雅思分数段描述
        analysis.bandDescriptors = this.getBandDescriptors(analysis.overall);

        return analysis;
    }

    // 流畅度深度分析
    analyzeFluencyAdvanced(speechStats) {
        const { transcript, duration, wordCount } = speechStats;
        const wpm = Math.round((wordCount / duration) * 60000);
        
        // 分析停顿和重复
        const hesitations = this.countHesitations(transcript);
        const repetitions = this.countRepetitions(transcript);
        const fillers = this.countFillers(transcript);

        // 语速评分
        let speedScore = 5;
        if (wpm >= 160) speedScore = 9;
        else if (wpm >= 150) speedScore = 8;
        else if (wpm >= 140) speedScore = 7;
        else if (wpm >= 120) speedScore = 6;
        else if (wpm >= 100) speedScore = 5;
        else speedScore = 4;

        // 流畅度扣分
        const hesitationPenalty = Math.min(hesitations * 0.5, 2);
        const repetitionPenalty = Math.min(repetitions * 0.3, 1.5);
        const fillerPenalty = Math.min(fillers * 0.2, 1);

        const finalScore = Math.max(speedScore - hesitationPenalty - repetitionPenalty - fillerPenalty, 1);

        return {
            score: Math.round(finalScore * 10) / 10,
            wpm: wpm,
            hesitations: hesitations,
            repetitions: repetitions,
            fillers: fillers,
            details: {
                speedLevel: this.getSpeedLevel(wpm),
                coherence: this.analyzeCoherence(transcript),
                naturalness: this.analyzeNaturalness(transcript)
            }
        };
    }

    // 词汇深度分析
    analyzeVocabularyAdvanced(speechStats) {
        const { transcript } = speechStats;
        const words = transcript.toLowerCase().match(/\b\w+\b/g) || [];
        const uniqueWords = [...new Set(words)];
        
        // 词汇多样性
        const lexicalDiversity = uniqueWords.length / words.length;
        
        // 高级词汇使用
        const advancedWordsUsed = this.countAdvancedWords(transcript);
        const idioms = this.countIdioms(transcript);
        const connectiveWordsUsed = this.countConnectiveWords(transcript);

        // 话题相关词汇
        const topicVocabulary = this.analyzeTopicVocabulary(transcript);

        // 词汇准确性（基于常见错误检查）
        const vocabularyErrors = this.checkVocabularyErrors(transcript);

        let score = 5;
        if (lexicalDiversity >= 0.8 && advancedWordsUsed >= 15) score = 9;
        else if (lexicalDiversity >= 0.75 && advancedWordsUsed >= 12) score = 8;
        else if (lexicalDiversity >= 0.7 && advancedWordsUsed >= 10) score = 7;
        else if (lexicalDiversity >= 0.6 && advancedWordsUsed >= 7) score = 6;
        else if (lexicalDiversity >= 0.5 && advancedWordsUsed >= 5) score = 5;

        return {
            score: Math.round(score * 10) / 10,
            diversity: Math.round(lexicalDiversity * 100),
            uniqueWords: uniqueWords.length,
            totalWords: words.length,
            advancedWords: advancedWordsUsed,
            idioms: idioms,
            connectiveWords: connectiveWordsUsed,
            topicVocabulary: topicVocabulary,
            errors: vocabularyErrors.length,
            details: {
                wordFrequency: this.getWordFrequency(words),
                vocabularyRange: this.assessVocabularyRange(uniqueWords),
                appropriateness: this.assessVocabularyAppropriateness(transcript)
            }
        };
    }

    // 语法深度分析
    analyzeGrammarAdvanced(speechStats) {
        const { transcript } = speechStats;
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // 句子复杂度分析
        const complexSentences = this.countComplexSentences(sentences);
        const averageWordsPerSentence = this.calculateAverageWordsPerSentence(sentences);
        
        // 语法错误检测
        const grammarErrors = this.detectGrammarErrors(transcript);
        
        // 时态使用分析
        const tenseUsage = this.analyzeTenseUsage(transcript);
        
        // 语法结构多样性
        const structureDiversity = this.analyzeStructureDiversity(sentences);

        let score = 5;
        const errorRate = grammarErrors.length / sentences.length;
        
        if (errorRate <= 0.1 && complexSentences >= 0.6) score = 9;
        else if (errorRate <= 0.2 && complexSentences >= 0.5) score = 8;
        else if (errorRate <= 0.3 && complexSentences >= 0.4) score = 7;
        else if (errorRate <= 0.4 && complexSentences >= 0.3) score = 6;
        else if (errorRate <= 0.5) score = 5;

        return {
            score: Math.round(score * 10) / 10,
            sentenceCount: sentences.length,
            averageWordsPerSentence: Math.round(averageWordsPerSentence),
            complexSentenceRatio: Math.round(complexSentences * 100),
            grammarErrors: grammarErrors.length,
            errorRate: Math.round(errorRate * 100),
            tenseUsage: tenseUsage,
            structureDiversity: structureDiversity,
            details: {
                commonErrors: grammarErrors.slice(0, 3),
                strengths: this.identifyGrammarStrengths(transcript),
                suggestions: this.generateGrammarSuggestions(grammarErrors)
            }
        };
    }

    // 发音深度分析（基于语音识别准确度）
    analyzePronunciationAdvanced(speechStats) {
        const { transcript, recognitionConfidence = 0.8 } = speechStats;
        
        // 基于识别准确度推断发音质量
        let score = 5;
        if (recognitionConfidence >= 0.95) score = 9;
        else if (recognitionConfidence >= 0.9) score = 8;
        else if (recognitionConfidence >= 0.85) score = 7;
        else if (recognitionConfidence >= 0.8) score = 6;
        else if (recognitionConfidence >= 0.7) score = 5;

        // 音节和重音分析
        const syllableComplexity = this.analyzeSyllableComplexity(transcript);
        const intonationPatterns = this.analyzeIntonationPatterns(transcript);

        return {
            score: Math.round(score * 10) / 10,
            clarity: Math.round(recognitionConfidence * 100),
            syllableComplexity: syllableComplexity,
            intonationPatterns: intonationPatterns,
            details: {
                pronunciationTips: this.generatePronunciationTips(score),
                practiceWords: this.suggestPracticeWords(transcript),
                strengthAreas: this.identifyPronunciationStrengths(recognitionConfidence)
            }
        };
    }

    // 生成具体反馈
    generateSpecificFeedback(scores, questionType) {
        const feedback = {
            fluency: [],
            vocabulary: [],
            grammar: [],
            pronunciation: []
        };

        // 流畅度反馈
        if (scores.fluency.score >= 7) {
            feedback.fluency.push("Your speaking flow is natural and smooth");
        } else {
            feedback.fluency.push("Try to reduce hesitations and speak more continuously");
        }

        // 词汇反馈
        if (scores.vocabulary.score >= 7) {
            feedback.vocabulary.push("Excellent use of varied and sophisticated vocabulary");
        } else {
            feedback.vocabulary.push("Expand your vocabulary range and use more precise words");
        }

        // 语法反馈
        if (scores.grammar.score >= 7) {
            feedback.grammar.push("Good use of complex grammatical structures");
        } else {
            feedback.grammar.push("Focus on accuracy and try using more complex sentences");
        }

        // 发音反馈
        if (scores.pronunciation.score >= 7) {
            feedback.pronunciation.push("Clear pronunciation with good intonation");
        } else {
            feedback.pronunciation.push("Work on clarity and stress patterns");
        }

        return feedback;
    }

    // 生成改进计划
    generateImprovementPlan(scores, category) {
        const plan = {
            immediate: [],    // 立即可以改进的
            shortTerm: [],    // 1-2周内的目标
            longTerm: []      // 1个月以上的目标
        };

        // 根据最低分数确定优先级
        const sortedScores = Object.entries(scores)
            .sort(([,a], [,b]) => a.score - b.score);

        const lowestArea = sortedScores[0][0];
        const lowestScore = sortedScores[0][1].score;

        // 立即改进建议
        if (lowestArea === 'fluency') {
            plan.immediate.push("Practice speaking without stopping for 1-2 minutes daily");
            plan.immediate.push("Record yourself and listen for hesitations");
        } else if (lowestArea === 'vocabulary') {
            plan.immediate.push("Learn 5 new topic-specific words daily");
            plan.immediate.push("Practice using synonyms in your responses");
        }

        // 短期目标
        plan.shortTerm.push(`Improve ${lowestArea} score from ${lowestScore} to ${lowestScore + 0.5}`);
        plan.shortTerm.push("Practice with different question types daily");

        // 长期目标
        plan.longTerm.push("Achieve overall band 7+ in all criteria");
        plan.longTerm.push("Develop natural, confident speaking style");

        return plan;
    }

    // 辅助方法
    countHesitations(transcript) {
        const hesitationWords = ['um', 'uh', 'er', 'ah', 'well', 'you know'];
        return hesitationWords.reduce((count, word) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            return count + (transcript.match(regex) || []).length;
        }, 0);
    }

    countRepetitions(transcript) {
        const words = transcript.toLowerCase().split(/\s+/);
        let repetitions = 0;
        for (let i = 1; i < words.length; i++) {
            if (words[i] === words[i-1]) repetitions++;
        }
        return repetitions;
    }

    countFillers(transcript) {
        const fillers = ['like', 'basically', 'actually', 'literally', 'sort of', 'kind of'];
        return fillers.reduce((count, filler) => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            return count + (transcript.match(regex) || []).length;
        }, 0);
    }

    countAdvancedWords(transcript) {
        return this.advancedVocabulary.filter(word => 
            transcript.toLowerCase().includes(word.toLowerCase())
        ).length;
    }

    countConnectiveWords(transcript) {
        return this.connectiveWords.filter(word => 
            transcript.toLowerCase().includes(word.toLowerCase())
        ).length;
    }

    calculateOverallScore(scores) {
        const total = Object.values(scores).reduce((sum, score) => sum + score.score, 0);
        return Math.round((total / 4) * 10) / 10;
    }

    getBandDescriptors(score) {
        if (score >= 8.5) return { band: 9, description: "Expert User" };
        if (score >= 7.5) return { band: 8, description: "Very Good User" };
        if (score >= 6.5) return { band: 7, description: "Good User" };
        if (score >= 5.5) return { band: 6, description: "Competent User" };
        if (score >= 4.5) return { band: 5, description: "Modest User" };
        return { band: 4, description: "Limited User" };
    }

    // 补充缺失的辅助方法
    countIdioms(transcript) {
        const idioms = [
            'piece of cake', 'break the ice', 'hit the nail on the head',
            'once in a blue moon', 'when pigs fly', 'cost an arm and a leg',
            'break a leg', 'bite the bullet', 'cut to the chase',
            'get the ball rolling', 'hang in there', 'keep your chin up'
        ];
        return idioms.filter(idiom => 
            transcript.toLowerCase().includes(idiom.toLowerCase())
        ).length;
    }

    analyzeTopicVocabulary(transcript) {
        const topicWords = {
            'education': ['school', 'university', 'study', 'learn', 'teacher', 'student'],
            'environment': ['pollution', 'climate', 'nature', 'green', 'sustainable'],
            'technology': ['computer', 'internet', 'digital', 'online', 'smartphone'],
            'family': ['parents', 'children', 'relatives', 'siblings', 'household'],
            'work': ['job', 'career', 'professional', 'business', 'employment']
        };
        
        const foundTopics = {};
        for (const [topic, words] of Object.entries(topicWords)) {
            foundTopics[topic] = words.filter(word => 
                transcript.toLowerCase().includes(word)
            ).length;
        }
        return foundTopics;
    }

    checkVocabularyErrors(transcript) {
        const commonErrors = [
            { incorrect: 'informations', correct: 'information' },
            { incorrect: 'advices', correct: 'advice' },
            { incorrect: 'knowledges', correct: 'knowledge' },
            { incorrect: 'furnitures', correct: 'furniture' },
            { incorrect: 'homeworks', correct: 'homework' }
        ];
        
        return commonErrors.filter(error => 
            transcript.toLowerCase().includes(error.incorrect)
        );
    }

    getWordFrequency(words) {
        const frequency = {};
        words.forEach(word => {
            const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
            frequency[cleaned] = (frequency[cleaned] || 0) + 1;
        });
        return frequency;
    }

    assessVocabularyRange(uniqueWords) {
        if (uniqueWords.length > 100) return 'excellent';
        if (uniqueWords.length > 70) return 'good';
        if (uniqueWords.length > 40) return 'adequate';
        return 'limited';
    }

    assessVocabularyAppropriateness(transcript) {
        const formalWords = ['consequently', 'furthermore', 'nevertheless', 'substantial'];
        const informalWords = ['cool', 'awesome', 'stuff', 'things'];
        
        const formalCount = formalWords.filter(word => 
            transcript.toLowerCase().includes(word)
        ).length;
        
        const informalCount = informalWords.filter(word => 
            transcript.toLowerCase().includes(word)
        ).length;
        
        if (formalCount > informalCount) return 'formal';
        if (informalCount > formalCount) return 'informal';
        return 'neutral';
    }

    // 语法分析相关方法
    countComplexSentences(sentences) {
        const complexPatterns = [
            /\b(although|though|while|whereas|if|unless|because|since)\b/gi,
            /\b(which|who|that|where|when)\b/gi,
            /\band\b.*\band\b/gi,
            /\bbut\b.*\band\b/gi
        ];
        
        let complexCount = 0;
        sentences.forEach(sentence => {
            if (complexPatterns.some(pattern => pattern.test(sentence))) {
                complexCount++;
            }
        });
        
        return sentences.length > 0 ? complexCount / sentences.length : 0;
    }

    calculateAverageWordsPerSentence(sentences) {
        const totalWords = sentences.reduce((sum, sentence) => {
            return sum + sentence.trim().split(/\s+/).length;
        }, 0);
        return sentences.length > 0 ? totalWords / sentences.length : 0;
    }

    detectGrammarErrors(transcript) {
        const errors = [];
        
        // 冠词错误
        if (/\ba\s+[aeiou]/gi.test(transcript)) {
            errors.push({ type: 'article', message: '冠词使用错误 (a/an)' });
        }
        
        // 单复数错误
        if (/\b(this|that)\s+\w+s\b/gi.test(transcript)) {
            errors.push({ type: 'number', message: '单复数不一致' });
        }
        
        return errors;
    }

    analyzeTenseUsage(transcript) {
        const tensePatterns = {
            present: /\b(am|is|are|do|does)\b/gi,
            past: /\b(was|were|did|had)\b/gi,
            future: /\b(will|shall|going to)\b/gi,
            perfect: /\b(have|has|had)\s+\w+ed\b/gi
        };
        
        const usage = {};
        for (const [tense, pattern] of Object.entries(tensePatterns)) {
            usage[tense] = (transcript.match(pattern) || []).length;
        }
        return usage;
    }

    analyzeStructureDiversity(sentences) {
        const structures = {
            simple: 0,
            compound: 0,
            complex: 0
        };
        
        sentences.forEach(sentence => {
            const hasCoordinating = /\b(and|but|or|so)\b/gi.test(sentence);
            const hasSubordinating = /\b(because|although|if|when|while)\b/gi.test(sentence);
            
            if (hasSubordinating) {
                structures.complex++;
            } else if (hasCoordinating) {
                structures.compound++;
            } else {
                structures.simple++;
            }
        });
        
        return structures;
    }

    identifyGrammarStrengths(transcript) {
        const strengths = [];
        
        if (/\b(because|since|although|while)\b/gi.test(transcript)) {
            strengths.push('使用了复杂句型');
        }
        
        if (/\b(firstly|secondly|finally|however|therefore)\b/gi.test(transcript)) {
            strengths.push('使用了逻辑连接词');
        }
        
        return strengths;
    }

    generateGrammarSuggestions(errors) {
        const suggestions = [];
        
        errors.forEach(error => {
            if (error.type === 'article') {
                suggestions.push('注意在元音开头的单词前使用"an"而不是"a"');
            }
            if (error.type === 'number') {
                suggestions.push('检查单复数的一致性');
            }
        });
        
        return suggestions;
    }

    // 发音分析相关方法
    analyzeSyllableComplexity(transcript) {
        const complexWords = transcript.split(/\s+/).filter(word => word.length > 6);
        return complexWords.length;
    }

    analyzeIntonationPatterns(transcript) {
        const questionMarks = (transcript.match(/\?/g) || []).length;
        const exclamations = (transcript.match(/!/g) || []).length;
        return { questions: questionMarks, exclamations: exclamations };
    }

    generatePronunciationTips(score) {
        const tips = [];
        
        if (score < 6) {
            tips.push('练习常见单词的发音');
            tips.push('注意单词重音位置');
        }
        
        if (score < 7) {
            tips.push('练习连读和弱读');
            tips.push('注意语调变化');
        }
        
        return tips;
    }

    suggestPracticeWords(transcript) {
        const difficultWords = ['throughout', 'thoroughly', 'third', 'think', 'something'];
        const wordsInTranscript = transcript.toLowerCase().split(/\s+/);
        
        return difficultWords.filter(word => 
            wordsInTranscript.some(w => w.includes(word))
        );
    }

    identifyPronunciationStrengths(confidence) {
        const strengths = [];
        
        if (confidence > 0.9) {
            strengths.push('发音清晰准确');
        }
        
        if (confidence > 0.8) {
            strengths.push('语音识别率高');
        }
        
        return strengths;
    }

    // 其他分析方法
    getSpeedLevel(wpm) {
        if (wpm > 160) return 'fast';
        if (wpm > 130) return 'appropriate';
        if (wpm > 100) return 'slow';
        return 'very slow';
    }

    analyzeCoherence(transcript) {
        const connectiveWords = ['first', 'second', 'finally', 'however', 'therefore', 'moreover'];
        const foundConnectives = connectiveWords.filter(word => 
            transcript.toLowerCase().includes(word)
        ).length;
        return foundConnectives > 2 ? 'good' : 'needs improvement';
    }

    analyzeNaturalness(transcript) {
        const fillerCount = this.countFillers(transcript);
        const hesitationCount = this.countHesitations(transcript);
        const totalWords = transcript.split(/\s+/).length;
        
        const fillerRatio = fillerCount / totalWords;
        
        if (fillerRatio < 0.05) return 'natural';
        if (fillerRatio < 0.1) return 'somewhat natural';
        return 'needs improvement';
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedAnalysisEngine;
} else if (typeof window !== 'undefined') {
    window.AdvancedAnalysisEngine = AdvancedAnalysisEngine;
} 