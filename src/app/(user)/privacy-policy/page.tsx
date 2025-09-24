"use client";
import React from "react";
import SectionContainer from "@/shared/SectionContainer";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen text-white">
      <SectionContainer>
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              プライバシーポリシー
            </h1>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed mb-6">
                株式会社 F（以下「当社」といいます）は、当社の提供するサービス（以下「本サービス」といいます。）における、お客様の個人情報を含む利用者情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">1．収集する利用者情報・収集方法</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                本ポリシーにおいて、「利用者情報」とは、お客様の識別に係る情報、通信サービス上の行動履歴、その他お客様又はお客様の端末に関連して生成又は蓄積された情報であって、本ポリシーに基づき当社が収集するものを意味するものとします。
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                本サービスにおいて当社が収集する利用者情報は、その収集方法に応じて、以下のようなものとなります。
              </p>

              <h3 className="text-xl font-medium text-white mb-3">（1）お客様からご提供いただく情報</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                本サービスを利用するために、又は本サービスの利用を通じてお客様からご提供いただく情報は以下のとおりです。
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>メールアドレス等連絡先に関する情報</li>
                <li>クレジットカード情報</li>
                <li>お客様の肖像を含む静止画、動画情報</li>
                <li>入力フォームその他当社が定める方法を通じてお客様が入力又は送信する情報</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">（2）お客様が本サービスの利用において他のサービスと連携を許可することにより当該他のサービスからご提供いただく情報</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                お客様が、本サービスを利用するに当たり、ソーシャルネットワーキングサービス等の他のサービスとの連携を許可した場合には、その許可の際に御同意いただいた内容に基づき、以下の情報を当該外部サービスから収集します。
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>当該外部サービスでお客様が利用する ID</li>
                <li>その他当該外部サービスのプライバシー設定によりお客様が連携先に開示を認めた情報</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">（3）お客様が本サービスを利用するに当たって当社が収集する情報</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                当社は、本サービスへのアクセス状況やそのご利用方法に関する情報を収集することがあります。これには以下の情報が含まれます。
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>リファラ</li>
                <li>IP アドレス</li>
                <li>サーバーアクセスログに関する情報</li>
                <li>Cookie, ADID, IDFA その他の識別子</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">2．利用目的</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                当社は、本サービスのサービス提供に関わる利用者情報を蓄積して分析し、以下の目的で利用します。
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>本サービスに関する登録の受付、本人確認、お客様認証、お客様設定の記録、利用料金の決済計算等、本サービスの提供、維持、保護及び改善のため</li>
                <li>お客様のトラフィック測定及び行動測定のため</li>
                <li>広告の配信、表示及び効果測定のため</li>
                <li>本サービスに関するご案内、お問合せ等への対応のため</li>
                <li>本サービスに関する当社の規約、ポリシー等（以下「規約等」といいます。）に違反する行為に対する対応のため</li>
                <li>本サービスに関する規約等の変更などを通知するため</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">3．利用中止要請の方法</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                お客様は、本サービスの所定の設定を行うことにより、利用者情報の全部又は一部についてその収集又は利用の停止を求めることができ、この場合、当社は速やかに、当社の定めるところに従い、その利用を停止します。なお、利用者情報の項目によっては、その収集又は利用が本サービスの前提となるため、当社所定の方法により本サービスを退会した場合に限り、当社はその収集又は利用を停止します。
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">4．第三者提供</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                当社は、利用者情報のうち、個人情報については、あらかじめお客様の同意を得ないで、第三者（日本国外にある者を含みます。）に提供しません。ただし、次に掲げる事項があり第三者（日本国外にある者を含みます。）に提供する場合はこの限りではありません。
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部又は一部を委託する場合</li>
                <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                <li>国の機関若しくは地方公共団体又はその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、お客様の同意を得ることによって当該事務の遂行に支障を及ぼすおそれがある場合</li>
                <li>その他、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）その他の法令で認められる場合</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">5．個人情報の開示等の請求</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                当社は、お客様から、個人情報及び特定個人情報等に関して、利用目的の通知、開示、第三者提供記録、内容の訂正・追加又は削除、利用の停止、消去及び第三者への提供の停止（以下、「開示等」という。）を要求される場合には誠実に対応いたします。ただし、個人情報保護法その他の法令により、当社が開示の義務を負わない場合は、この限りではありません。なお、個人情報の開示につきましては、手数料（1 件当たり 1,000 円）を頂戴しておりますので、あらかじめご了承ください。
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">6．お問合せ窓口</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                ご意見、ご質問、苦情のお申出その他利用者情報の取扱いに関するお問合せは、以下の窓口までお願いいたします。
              </p>
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <p className="text-gray-300">住所 大阪府大阪市靱本町 1-10-7-1803</p>
                <p className="text-gray-300">株式会社 F 個人情報開示等相談窓口</p>
                <p className="text-gray-300">address kabusikif@gmail.com</p>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-4">7．プライバシーポリシーの変更手続</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                当社は、必要に応じて、本ポリシーを変更します。ただし、法令上お客様の同意が必要となるような本ポリシーの変更を行う場合、変更後の本ポリシーは、当社所定の方法で変更に同意したお客様に対してのみ適用されるものとします。なお、当社は、本ポリシーを変更する場合、変更後の本ポリシーの施行時期及び内容を当社のウェブサイト上の表示その他の適切な方法により周知し、又はお客様に通知します。
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">8．安全管理措置に関する事項</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                当社は、利用者情報について、漏えい、滅失又は毀損の防止等、その管理のために必要な安全管理措置を講じます。また、個人データを取り扱う従業者や委託先（再委託先等を含みます。）に対して、必要かつ適切な監督を行います。利用者情報の安全管理措置の内容は以下のとおりです。
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>利用者情報の取扱いに関する事務取扱責任者を設置するとともに、利用者情報を取扱う従業者及び当該従業者が取り扱う利用者情報の範囲を明確化し、個人情報保護法に違反している事実又は兆候を把握した場合の事務取扱責任者への報告連絡体制を整備しています。</li>
                <li>利用者情報の取扱状況について、定期的に自己点検を実施しています。</li>
                <li>利用者情報を取り扱う情報システムを外部からの不正アクセス又は不正ソフトウェアから保護する仕組みを導入しています。</li>
                <li>権限を有しない者による利用者情報の閲覧を防止する措置を実施しています。</li>
                <li>担当者及び取り扱う利用者情報データベース等の範囲を限定しています。</li>
              </ul>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                R7 年 6 月 23 日 制定
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default PrivacyPolicyPage;