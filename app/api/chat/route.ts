export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'

const HIRING_PROMPT = `あなたは「YouTube戦略台本エージェント」です。
ユーザーの情報をヒアリングし、最後に確認サマリーを出すことが役割です。

## ルール
- 常に日本語で応答する
- 1回のメッセージで聞くのは1問だけ
- 「なし」「スキップ」はそのまま受け入れて次へ進む
- 禁止ワード：「魔法」「設計図」「ロードマップ」「革命的」「圧倒的」

## 最初の挨拶
会話開始時に必ず以下を送る：
「こんにちは！YouTube戦略台本エージェントです 🎬

いくつか質問に答えるだけで、プロ品質の台本（パート1〜3）を生成します。

まず確認させてください。今回の動画はどちらのケースですか？

A）自分のチャンネルの動画
B）クライアントから依頼された案件」

## ヒアリング順序（必ずこの順番で1問ずつ聞く）
Q1: A/B判定
Q2: キーワード
Q3: ターゲット視聴者
Q4: ゴール（A認知 B LINE登録 C商品販売 Dおまかせ）
Q5: 発信者の情報・実績
Q6: Beforeエピソード（発信者自身の過去の苦労話。視聴者の悩みではなく発信者の話）
Q7: Afterエピソード（発信者の現在の状態）
Q8: 独自視点（なければスキップOK）
Q9: 確認サマリーを以下の形式で表示して「この内容でOKですか？」と聞く

📌 キーワード：〇〇
👥 ターゲット：〇〇
🎯 ゴール：〇〇
👤 発信者：〇〇
📉 Before：〇〇
📈 After：〇〇
💡 独自視点：〇〇

ユーザーが「OK」と言ったら「台本を生成します。少々お待ちください 🎬」とだけ返す。
それ以上は何も生成しない。`

const SCRIPT_PROMPT = `あなたは世界トップクラスのYouTube台本ライターです。
以下の情報をもとに指定されたパートの台本を生成してください。

## 台本執筆ルール
- 話し言葉で書く
- 「ぶっちゃけ」「要は」「なんでかっていうと」を自然に使う
- 一文は40文字以内
- 禁止ワード：「魔法」「設計図」「ロードマップ」「革命的」「圧倒的」
- CTAは押し売り感ゼロ
- 各セクションは【セクション名】タグで区切る
- 台本のみ出力（前置き・説明不要）`

async function callClaude(messages: {role: string, content: string}[], system: string, maxTokens: number) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

function extractInfo(messages: {role: string, content: string}[]) {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n')
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  // 初回起動（messagesが空）の場合は挨拶を返す
  if (!messages || messages.length === 0) {
    const reply = await callClaude(
      [{ role: 'user', content: 'スタート' }],
      HIRING_PROMPT,
      800
    )
    return NextResponse.json({ reply })
  }

  const apiMessages = messages.map((m: { role: string; text: string }) => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.text,
  }))

  const lastUserMsg = messages[messages.length - 1]?.text?.trim().toLowerCase() || ''
  const isOK = ['ok', 'ＯＫ', 'okay', 'はい', 'よし'].includes(lastUserMsg)

  // OKが来たら3パートを並列生成
  if (isOK && messages.length > 5) {
    const conversationContext = extractInfo(apiMessages.slice(0, -1))
    const basePrompt = `以下の会話から情報を抽出して台本を生成してください：\n\n${conversationContext}`

    const p1Prompt = `${basePrompt}

【パート1の構成】
【冒頭フック（0〜30秒）】視聴者が「これは自分のことだ」と感じる問いかけから始める
【この動画で手に入ること】具体的な結果を4〜5つ箇条書き
【こんな人に役立ちます】視聴者の悩みを5つ代弁
【自己紹介】発信者の肩書き・実績を親しみやすく。「でも昔は…」でBeforeへつなぐ
【どん底エピソード（Before）】発信者が一番辛かった時期を感情豊かに描写
【変化のきっかけ（After）】今の状態を具体的に。「自分にもできるかも」と感じさせる

パート1のみ出力してください。`

    const p2Prompt = `${basePrompt}

【パート2の構成】
【本編開始・問題提起】「頑張っているのに結果が出ない本当の理由」を提示
【古い常識の否定】視聴者がこれまで信じてきた「成果の出ない手法」を論理的に否定
【変革の柱①】結論→疑問→新基準→常識破壊→具体事例→理想の未来→最終結論
【変革の柱②】同上
【変革の柱③】同上
【本編まとめ・理想の未来】3つの柱を統合。行動した後の未来を五感で描写
【自己流の落とし穴】一人でやろうとすることの3つのリスク

パート2のみ出力してください。`

    const p3Prompt = `${basePrompt}

【パート3の構成】
【今日のまとめ】3つの核心を箇条書き
【CTA】ゴールへの自然な誘導。押し売り感ゼロ
【理想の未来の再確認】行動した3ヶ月後の日常を五感で描写
【視聴者への問いかけ】コメント促進
【最後の一言】情熱的で温かいクロージング

パート3のみ出力してください。`

    try {
      const [p1, p2, p3] = await Promise.all([
        callClaude([{ role: 'user', content: p1Prompt }], SCRIPT_PROMPT, 1500),
        callClaude([{ role: 'user', content: p2Prompt }], SCRIPT_PROMPT, 2000),
        callClaude([{ role: 'user', content: p3Prompt }], SCRIPT_PROMPT, 1500),
      ])
      return NextResponse.json({
        reply: '台本が完成しました 🎉\n\n下のエリアにパート1〜3が表示されています。\n「全部コピー」ボタンでコピーできます。\n\n修正したい箇所があれば「〇〇を直して」と入力してください。',
        script: { p1, p2, p3 }
      })
    } catch {
      return NextResponse.json({ reply: '台本の生成中にエラーが発生しました。もう一度「OK」と入力してください。' })
    }
  }

  // 通常のヒアリング
  const reply = await callClaude(apiMessages, HIRING_PROMPT, 800)
  return NextResponse.json({ reply })
}
