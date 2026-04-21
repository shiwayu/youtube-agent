export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `あなたは「YouTube戦略台本エージェント」です。
ユーザーの情報をヒアリングし、プロ品質のYouTube台本を生成することが唯一のゴールです。

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
Q2: キーワード →「この動画のメインキーワードを教えてください」
Q3: ターゲット視聴者 →「ターゲット視聴者はどんな人ですか？」
Q4: ゴール →「A）認知 B）LINE登録 C）商品販売 D）おまかせ」
Q5: 発信者の情報・実績
Q6: Beforeエピソード →「発信者自身の過去の苦労話を教えてください（視聴者の悩みではなく発信者の話）」
Q7: Afterエピソード →「今はどう変わりましたか？」
Q8: 独自視点 →「世間の常識への反論はありますか？なければスキップでOK」
Q9: 確認サマリーを表示して「OK」を待つ

## 台本生成
「OK」をもらったら、以下の形式で必ずパート1のみを先に生成する。

パート1を生成したら最後に以下を追加する：
「パート1が完成しました！続けてパート2を生成します。少々お待ちください。」

そして以下のJSONを出力する：
PART1_DONE
{"p1":"パート1の全文"}
PART1_END

次のメッセージでパート2を生成し、最後に以下を出力する：
PART2_DONE
{"p2":"パート2の全文"}
PART2_END

さらに次のメッセージでパート3を生成し、最後に以下を出力する：
PART3_DONE
{"p3":"パート3の全文"}
PART3_END

## 台本構成

### パート1（フック〜共感）
【冒頭フック（0〜30秒）】視聴者が「これは自分のことだ」と感じる問いかけから始める
【この動画で手に入ること】具体的な結果を4〜5つ箇条書き
【こんな人に役立ちます】視聴者の悩みを5つ代弁
【自己紹介】発信者の肩書き・実績を親しみやすく。「でも昔は…」でBeforeへつなぐ
【どん底エピソード（Before）】発信者が一番辛かった時期を感情豊かに描写
【変化のきっかけ（After）】今の状態を具体的に。「自分にもできるかも」と感じさせる

### パート2（本編）
【本編開始・問題提起】「頑張っているのに結果が出ない本当の理由」を提示
【古い常識の否定】視聴者がこれまで信じてきた「成果の出ない手法」を論理的に否定
【変革の柱①】結論→疑問→新基準→常識破壊→具体事例→理想の未来→最終結論
【変革の柱②】同上
【変革の柱③】同上
【本編まとめ・理想の未来】3つの柱を統合。行動した後の未来を五感で描写
【自己流の落とし穴】一人でやろうとすることの3つのリスク

### パート3（クロージング・CTA）
【今日のまとめ】3つの核心を箇条書き
【CTA】ゴールへの自然な誘導。押し売り感ゼロ
【理想の未来の再確認】行動した3ヶ月後の日常を五感で描写
【視聴者への問いかけ】コメント促進
【最後の一言】情熱的で温かいクロージング

## 台本執筆ルール
- 話し言葉で書く
- 「ぶっちゃけ」「要は」「なんでかっていうと」を自然に使う
- 一文は40文字以内
- 禁止ワードは絶対に使わない
- CTAは押し売り感ゼロ
- 各セクションは【セクション名】タグで区切る`

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
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: apiMessages.length > 0 ? apiMessages : [{ role: 'user', content: 'スタート' }],
    }),
  })

  const data = await response.json()
  const reply = data.content?.[0]?.text || JSON.stringify(data)

  // パート1完成チェック
  const part1Match = reply.match(/PART1_DONE\s*([\s\S]*?)\s*PART1_END/)
  if (part1Match) {
    try {
      const parsed = JSON.parse(part1Match[1])
      const cleanReply = reply.replace(/PART1_DONE[\s\S]*?PART1_END/, '').trim()
      return NextResponse.json({ reply: cleanReply, partialScript: { p1: parsed.p1 } })
    } catch {
      return NextResponse.json({ reply })
    }
  }

  // パート2完成チェック
  const part2Match = reply.match(/PART2_DONE\s*([\s\S]*?)\s*PART2_END/)
  if (part2Match) {
    try {
      const parsed = JSON.parse(part2Match[1])
      const cleanReply = reply.replace(/PART2_DONE[\s\S]*?PART2_END/, '').trim()
      return NextResponse.json({ reply: cleanReply, partialScript: { p2: parsed.p2 } })
    } catch {
      return NextResponse.json({ reply })
    }
  }

  // パート3完成チェック
  const part3Match = reply.match(/PART3_DONE\s*([\s\S]*?)\s*PART3_END/)
  if (part3Match) {
    try {
      const parsed = JSON.parse(part3Match[1])
      const cleanReply = reply.replace(/PART3_DONE[\s\S]*?PART3_END/, '台本が完成しました 🎉\n\nパート1〜3が下のエリアに表示されています。\n「全部コピー」ボタンでコピーできます。\n\n修正したい箇所があれば「〇〇を直して」と入力してください。').trim()
      return NextResponse.json({ reply: cleanReply, partialScript: { p3: parsed.p3 } })
    } catch {
      return NextResponse.json({ reply })
    }
  }

  return NextResponse.json({ reply })
}
