export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

export const privacyPolicy: Record<'ko' | 'en', LegalDoc> = {
  ko: {
    title: '개인정보처리방침',
    effectiveDate: '시행일: 2026년 8월 6일',
    intro:
      'ChoreGarden(이하 "서비스")은 1인 개발자가 운영하는 개인 프로젝트입니다. 이 문서는 서비스가 어떤 정보를 수집하고 어떻게 사용하는지 최대한 쉬운 말로 설명합니다.',
    sections: [
      {
        heading: '1. 수집하는 정보',
        body: [
          '부모 계정: 이메일 주소, 비밀번호(암호화되어 저장되며 개발자도 볼 수 없습니다), 가족 이름.',
          '아이 계정: 이름, 4자리 PIN, 시급, 선택한 꽃 종류. PIN은 부모가 아이에게 로그인 정보를 안내할 수 있도록 저장되며, Firestore 보안 규칙으로 가족 외부의 접근을 제한합니다.',
          '이용 기록: 등록한 집안일, 소요 시간, 승인/거절 내역, 정산 요청 및 처리 내역, 정원 성장 기록.',
          '기기 저장 정보: 언어 설정만 브라우저 localStorage에 저장됩니다. 광고·추적 목적의 쿠키는 사용하지 않습니다.',
        ],
      },
      {
        heading: '2. 아이(미성년) 정보에 대해',
        body: [
          '아이는 별도의 이메일 계정 없이, 부모가 발급한 Family Code와 PIN으로만 로그인합니다.',
          '아이의 이름·PIN·이용 기록은 오직 해당 가족(부모 계정)이 만든 데이터이며, 그 가족 외부에는 공개되지 않습니다.',
          '부모는 언제든지 아이 계정 정보를 수정하거나 삭제할 수 있습니다.',
        ],
      },
      {
        heading: '3. 정보 이용 목적',
        body: [
          '집안일 등록·승인, 용돈 계산, 정원 성장 표시 등 서비스의 핵심 기능을 제공하기 위해서만 사용합니다.',
          '수집한 정보를 광고, 마케팅, 프로파일링 목적으로 이용하지 않습니다.',
        ],
      },
      {
        heading: '4. 정보 저장 및 제3자 제공',
        body: [
          '모든 데이터는 Google Firebase(Firestore, Authentication) 인프라에 저장됩니다. Firebase의 자체 개인정보 처리방침은 Google의 정책을 따릅니다.',
          '서비스 운영에 필요한 인프라 제공업체(Firebase/Google Cloud) 외에는 어떤 제3자에게도 정보를 판매하거나 제공하지 않습니다.',
        ],
      },
      {
        heading: '5. 실제 금전 거래 없음',
        body: [
          '서비스는 용돈 금액을 계산하고 기록만 할 뿐, 실제 계좌 이체나 결제를 처리하지 않습니다. 실제 지급은 보호자가 서비스 밖에서 직접 진행합니다.',
        ],
      },
      {
        heading: '6. 보관 기간 및 삭제 요청',
        body: [
          '계정이 존재하는 동안 정보를 보관하며, 이용자가 삭제를 요청하면 지체 없이 처리합니다.',
          '삭제를 원하시면 아래 문의처로 연락해 주세요.',
        ],
      },
      {
        heading: '7. 보안',
        body: [
          '부모 계정 비밀번호는 Firebase Authentication을 통해 암호화되어 저장되며 개발자도 볼 수 없습니다.',
          '아이 PIN은 부모가 언제든 확인하고 아이에게 공유할 수 있도록 저장되며, Firestore 보안 규칙으로 해당 가족 외부의 접근을 제한합니다.',
          'Firestore 보안 규칙을 통해 각 가족은 자신의 데이터에만 접근할 수 있도록 제한하고 있습니다.',
        ],
      },
      {
        heading: '8. 문의처',
        body: ['개발자 이메일: support@jookland.com'],
      },
      {
        heading: '9. 안내',
        body: [
          '이 문서는 개인 개발자가 서비스 이용자를 위해 직접 작성한 요약본이며, 법률 자문을 대체하지 않습니다. 정책은 서비스 변경에 따라 수정될 수 있으며, 중요한 변경 시 이 페이지를 통해 안내합니다.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    effectiveDate: 'Effective: August 6, 2026',
    intro:
      'ChoreGarden ("the Service") is an independent, solo-developed project. This page explains, in plain language, what information the Service collects and how it is used.',
    sections: [
      {
        heading: '1. Information we collect',
        body: [
          'Parent accounts: email address, password (stored encrypted — the developer cannot see it), family name.',
          "Child accounts: name, a 4-digit PIN, hourly rate, chosen flower type. The PIN is stored so the parent can view and share it with their child; Firestore security rules restrict access to outside that family.",
          'Activity records: logged chores, duration, approval/decline history, payout requests and their status, garden growth history.',
          'On-device storage: only your language preference is stored in browser localStorage. No advertising or tracking cookies are used.',
        ],
      },
      {
        heading: "2. About children's information",
        body: [
          "Children sign in with a Family Code and PIN issued by their parent — no separate email account is created for a child.",
          "A child's name, PIN, and activity records belong to that family's parent account and are never exposed outside that family.",
          'The parent can edit or delete a child profile at any time.',
        ],
      },
      {
        heading: '3. How information is used',
        body: [
          'Solely to provide the Service\'s core features: logging and approving chores, calculating allowance, and displaying garden growth.',
          'We do not use collected information for advertising, marketing, or profiling.',
        ],
      },
      {
        heading: '4. Storage and third parties',
        body: [
          "All data is stored on Google Firebase (Firestore, Authentication) infrastructure, subject to Google's own policies.",
          'We do not sell or share information with any third party other than the infrastructure provider (Firebase/Google Cloud) required to run the Service.',
        ],
      },
      {
        heading: '5. No real money moves through the app',
        body: [
          'The Service only calculates and records allowance amounts — it does not process bank transfers or payments. Parents pay children directly, outside the app.',
        ],
      },
      {
        heading: '6. Retention and deletion requests',
        body: [
          'Information is kept for as long as the account exists. Deletion requests are honored promptly.',
          'To request deletion, contact us using the details below.',
        ],
      },
      {
        heading: '7. Security',
        body: [
          "The parent account password is encrypted by Firebase Authentication — the developer cannot see it.",
          "A child's PIN is stored so the parent can view and share it; Firestore security rules restrict access to outside that family.",
          "Firestore security rules restrict each family to its own data.",
        ],
      },
      {
        heading: '8. Contact',
        body: ['Developer email: support@jookland.com'],
      },
      {
        heading: '9. Note',
        body: [
          'This page is a plain-language summary written directly by the independent developer of this Service and is not a substitute for legal advice. It may be updated as the Service changes; material changes will be posted here.',
        ],
      },
    ],
  },
};

export const termsOfService: Record<'ko' | 'en', LegalDoc> = {
  ko: {
    title: '이용약관',
    effectiveDate: '시행일: 2026년 8월 6일',
    intro:
      'ChoreGarden은 부모와 아이가 집안일과 용돈을 함께 관리하도록 돕는 가족용 도구입니다. 이 약관은 서비스 이용 조건을 설명합니다.',
    sections: [
      {
        heading: '1. 서비스 설명',
        body: [
          '아이가 집안일을 등록하면 부모가 승인하고, 승인된 시간만큼 용돈이 계산되어 화면 속 정원이 자라나는 가족용 웹 서비스입니다.',
          '서비스는 금액을 계산·기록할 뿐이며, 실제 계좌 이체나 결제 기능은 제공하지 않습니다. 실제 지급은 보호자의 책임하에 서비스 밖에서 이루어집니다.',
        ],
      },
      {
        heading: '2. 계정과 책임',
        body: [
          '부모 계정은 이메일과 비밀번호로 가입하며, 해당 계정으로 등록된 모든 아이 계정과 데이터에 대한 관리 책임은 부모에게 있습니다.',
          '아이 계정(Family Code + PIN)은 부모가 발급·관리하며, PIN이 유출되지 않도록 관리할 책임도 부모에게 있습니다.',
          '비밀번호·PIN이 노출되었다고 의심되면 즉시 재설정해 주세요.',
        ],
      },
      {
        heading: '3. 이용자의 의무',
        body: [
          '타인의 계정을 무단으로 사용하거나, 서비스를 부정한 목적으로 이용하지 않습니다.',
          '서비스에 부담을 주는 자동화된 접근(크롤링, 과도한 요청 등)을 하지 않습니다.',
        ],
      },
      {
        heading: '4. 서비스 변경 및 중단',
        body: [
          '본 서비스는 1인 개발자가 개인 프로젝트로 운영하며, 기능은 예고 없이 추가·변경될 수 있습니다.',
          '부득이한 사정으로 서비스 제공이 중단될 수 있으며, 가능한 경우 사전에 안내합니다.',
        ],
      },
      {
        heading: '5. 면책 조항',
        body: [
          '서비스는 "있는 그대로" 제공되며, 중단 없는 이용이나 오류 없는 동작을 보장하지 않습니다.',
          '서비스에 기록된 금액 정보는 참고용이며, 실제 정산은 보호자와 아이 간의 합의에 따릅니다. 서비스는 실제 금전 거래의 당사자가 아닙니다.',
          '개발자는 법이 허용하는 최대한의 범위에서 서비스 이용으로 발생한 간접적 손해에 대해 책임을 지지 않습니다.',
        ],
      },
      {
        heading: '6. 약관 변경',
        body: ['약관은 서비스 개선에 따라 변경될 수 있으며, 중요한 변경 시 이 페이지를 통해 안내합니다.'],
      },
      {
        heading: '7. 문의처',
        body: ['개발자 이메일: support@jookland.com'],
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    effectiveDate: 'Effective: August 6, 2026',
    intro:
      'ChoreGarden is a family tool that helps parents and children manage chores and allowance together. These terms describe the conditions of using the Service.',
    sections: [
      {
        heading: '1. What the Service does',
        body: [
          "A child logs a chore, a parent approves it, and the approved time is converted into allowance that grows a flower in the child's on-screen garden.",
          'The Service only calculates and records amounts — it does not process bank transfers or payments. Actual payment happens outside the app, at the parent\'s discretion.',
        ],
      },
      {
        heading: '2. Accounts and responsibility',
        body: [
          'A parent account is created with an email and password. The parent is responsible for all child accounts and data created under that account.',
          "Child accounts (Family Code + PIN) are issued and managed by the parent, who is also responsible for keeping the PIN from leaking.",
          'If you suspect a password or PIN has been exposed, reset it immediately.',
        ],
      },
      {
        heading: '3. User obligations',
        body: [
          "Do not use another person's account without authorization, or use the Service for unlawful purposes.",
          'Do not place undue load on the Service through automated access such as scraping or excessive requests.',
        ],
      },
      {
        heading: '4. Changes and discontinuation',
        body: [
          'This Service is run by a single independent developer as a personal project; features may be added or changed without prior notice.',
          'The Service may be discontinued if necessary; we will try to give notice in advance when possible.',
        ],
      },
      {
        heading: '5. Disclaimer',
        body: [
          'The Service is provided "as is," without guarantee of uninterrupted or error-free operation.',
          'Amounts recorded in the Service are for reference; actual settlement is by agreement between the parent and child. The Service is not a party to any real financial transaction.',
          'To the fullest extent permitted by law, the developer is not liable for indirect damages arising from use of the Service.',
        ],
      },
      {
        heading: '6. Changes to these terms',
        body: ['These terms may change as the Service evolves; material changes will be posted here.'],
      },
      {
        heading: '7. Contact',
        body: ['Developer email: support@jookland.com'],
      },
    ],
  },
};
