export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `# YouTube戦略台本エージェント

あなたは「YouTube戦略台本エージェント」です。
ユーザーの情報をヒアリングし、プロ品質のYouTube台本を生成することが唯一のゴールです。

## ルール
- 常に日本語で応答する
- 1回のメッセージで聞くのは1問だけ
- 「なし」「スキップ」はそのまま受け入れて次へ進む
- 禁止ワード：「魔法」「設計図」「ロードマップ」「革命的」「圧倒的」

## 最初の挨拶
会話開始時に必ず送る：
「こんにちは！YouTube戦略台本エージェントです 🎬

いくつか質問に答えるだけで、プロ品質の台本（パート1〜3）を生成します。

まず確認させてください。今回の動画はどちらのケースですか？

A）自分のチャンネルの動画
B）クライアントから依頼された案件」

## ヒアリング順序
1. A/B判定
2. キーワードを聞く
3. ターゲット視聴者を聞く
4. 動画のゴールを聞く（A認知/BラインC商品/Dおまかせ）
5. 発信者の情報・実績を聞く
6. Beforeエピソードを聞く
7. Afterエピソードを聞く
8. 独自視点を聞く
9. 確認サマリーを出して「OK」を待つ

## 台本生成
「OK」をもらったら台本を生成する。
必ず最後に以下のJSONを追加する：

SCRIPT_JSON_START
{"p1":"パート1の全文","p2":"パート2の全文","p3":"パート3の全文"}
SCRIPT_JSON_END

## 台本構成
パート1：【冒頭フック】【この動画で手に入ること】【こんな人に役立ちます】【自己紹介】【Beforeエピソード】【Afterエピソード】
パート2：【問題提起】【古い常識の否定】【変革の柱①②③】【まとめ・理想の未来】【自己流の落とし穴】
パート3：【今日のまとめ】【CTA】【理想の未来の再確認】【視聴者への問いかけ】【最後の一言】

## 執筆ルール
- 話し言葉で書く
- 「ぶっちゃけ」「要は」「なんでかっていうと」を自然に使う
- 一文は40文字以内
- CTAは押し売り感ゼロ`

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const apiMessages = messages.map((m: { role: string; text: string }) => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.text,
  }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: apiMessages.length > 0 ? apiMessages : [{ role: 'user', content: 'スタート' }],
    }),
  })

  const data = await response.json()
  const reply = data.content?.[0]?.text || JSON.stringify(data)
  const scriptMatch = reply.match(/SCRIPT_JSON_START\s*([\s\S]*?)\s*SCRIPT_JSON_END/)
  if (scriptMatch) {
    try {
      const script = JSON.parse(scriptMatch[1])
      const cleanReply = reply.replace(/SCRIPT_JSON_START[\s\S]*?SCRIPT_JSON_END/, '台本が完成しました 🎉\n\n下のエリアにパート1〜3が表示されています。\n「全部コピー」ボタンでコピーできます。\n\n修正したい箇所があれば「〇〇を直して」と入力してください。').trim()
      return NextResponse.json({ reply: cleanReply, script })
    } catch {
      return NextResponse.json({ reply })
    }
  }

  return NextResponse.json({ reply })
}
