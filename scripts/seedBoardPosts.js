import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import admin from 'firebase-admin';

const SEED_BATCH = 'board-demo-v1';
const DEFAULT_PASSWORD = 'seed1234';

const BOARD_POST_CONTENTS = [
  '사이트 첫 화면 분위기가 은근히 세련돼서 들어오자마자 구경하게 됐어요. 게시판까지 자연스럽게 이어져서 커뮤니티 느낌도 좋네요.',
  '생각보다 사용이 단순해서 좋았습니다. 사진만 고르면 바로 흐름이 이어져서 처음 써보는 사람도 덜 헤맬 것 같아요.',
  '친구랑 같이 얼굴 사진 바꿔가면서 해보면 진짜 재밌을 것 같아요. 결과 비교하는 재미가 꽤 있네요.',
  '한복 샘플 의상 구경하는 재미가 의외로 컸어요. 그냥 보기만 해도 색감이 잘 보여서 한참 눌러봤습니다.',
  '결과가 바로바로 나오는 느낌이라 기다리는 스트레스가 덜하네요. 테스트용으로 여러 장 올려보고 싶어졌어요.',
  '샘플 디자인이 눈에 잘 들어와서 어떤 옷을 고를지 빠르게 결정됐어요. 처음 접속한 사람도 바로 이해할 만한 흐름입니다.',
  '사이트 전반적으로 깔끔해서 마음에 들었습니다. 기능이 많아도 복잡해 보이지 않는 점이 좋았어요.',
  '모바일에서도 이런 흐름 그대로 편하게 되면 자주 들어올 것 같아요. 이동 중에 친구 보여주기 딱 좋을 것 같습니다.',
  '가볍게 재미로 들어왔는데 생각보다 결과 보는 맛이 있네요. 샘플만 구경해도 시간이 금방 갑니다.',
  '친구들끼리 단톡방에서 링크 공유하고 같이 돌려보면 반응 좋을 것 같아요. 누가 제일 잘 어울리는지 보는 재미가 있을 듯합니다.',
  '전통 의상 샘플이 있어서 더 흥미로웠어요. 단순한 사진 합성 느낌보다 테마 구경하는 기분이 들어서 좋았습니다.',
  '사용법이 어렵지 않아서 부모님께도 한번 보여드리고 싶네요. 사진 고르고 결과 보는 과정이 직관적입니다.',
  '전체적으로 서비스가 가벼운 편이라 테스트하기 편했어요. 처음엔 호기심이었는데 계속 눌러보게 됩니다.',
  '결과 이미지를 보는 순간 웃음이 나왔어요. 친구랑 서로 다른 의상 입혀보면서 놀기 좋겠습니다.',
  '샘플 의상 카테고리가 더 늘어나면 오래 머물게 될 것 같아요. 지금도 충분히 재미있는데 확장성이 보여요.',
  'UI가 과하게 복잡하지 않아서 좋습니다. 게시판도 같이 있으니 실제 사용자 반응 보는 재미가 있네요.',
  '한복이랑 다른 나라 전통 의상 비교해보는 재미가 있었어요. 사진 한 장으로 분위기가 달라지는 게 신기합니다.',
  '테스트 서비스인데도 감성이 있어서 기억에 남네요. 메인 화면 영상이랑 같이 보니까 몰입감이 있습니다.',
  '친구 사진으로 장난치듯 해봤는데 결과가 제법 그럴듯해서 다들 웃었어요. 같이 해보면 훨씬 재밌는 타입의 서비스네요.',
  '샘플 선택 방식이 편해서 좋았습니다. 괜히 파일 찾느라 막히지 않고 바로 체험할 수 있는 점이 강점 같아요.',
  '생각보다 결과 확인까지 흐름이 매끄러웠어요. 로딩 중 안내 문구도 있어서 덜 답답했습니다.',
  '사이트 이름도 한 번 들으면 기억에 남네요. 테스트하면서도 브랜드 톤이 어느 정도 잡혀 있다는 느낌이 들었습니다.',
  '지인들 프로필 사진으로 돌려보면 반응 꽤 좋을 듯합니다. 소소하게 웃기면서도 결과물은 또 제법 진지해요.',
  '샘플 의상 색감이 예쁘게 정리돼 있어서 구경만 해도 재미있네요. 특히 전통 의상 쪽은 더 눈길이 갔습니다.',
  '가입하고 나서 바로 써볼 수 있는 구조가 괜찮았어요. 무료 횟수도 테스트용으로는 적당하게 느껴졌습니다.',
  '결과물 저장까지 바로 이어지는 점이 편했습니다. 테스트 끝나고 친구한테 바로 보내주기 좋겠어요.',
  '페이지 이동이 많지 않아서 집중이 잘 됩니다. 한 화면에서 대부분 해결되는 느낌이라 사용성이 괜찮네요.',
  '재미 요소랑 실사용 가능성이 같이 보였어요. 나중에 모임이나 행사 준비할 때 써봐도 괜찮을 것 같습니다.',
  '강아지나 고양이 샘플도 보여서 웃겼어요. 사람만 있는 줄 알았는데 이런 포인트가 있어서 더 오래 보게 됩니다.',
  '친구랑 내기하듯 서로 어울리는 옷 골라주면 시간 잘 갈 것 같아요. 단순한데 은근 중독성 있네요.',
  '전체적인 컬러 톤이 안정적이라 눈이 편했습니다. 샘플 카드도 정돈돼 보여서 첫인상이 좋았어요.',
  '테스트 게시판이 있어서 한마디 남기기 좋네요. 다른 사람 반응까지 같이 보이니 서비스가 덜 비어 보입니다.',
  '한복 샘플 퀄리티가 생각보다 괜찮아서 놀랐어요. 그냥 참고용 정도일 줄 알았는데 구경할 맛이 있습니다.',
  '사용자 입장에서는 설명이 길지 않아서 좋았습니다. 직접 눌러보면서 익히는 구조라 부담이 적어요.',
  '모바일 최적화가 더 좋아지면 진짜 자주 쓸 듯해요. 외출 중에도 친구랑 바로 비교해보기 좋을 것 같습니다.',
  '사진 한 장으로 결과 분위기가 확 바뀌는 게 재미있네요. 의상별로 느낌 차이 보는 맛이 있습니다.',
  '친구 생일이나 모임 전에 다 같이 해보면 분위기 풀리겠어요. 가벼운 놀이처럼 시작하기 좋은 서비스네요.',
  '전반적으로 테스트 서비스치고 완성도가 높게 느껴졌습니다. 조금만 다듬으면 주변에 추천하기도 괜찮겠어요.',
  '샘플 의상 설명이 더 붙으면 보는 재미가 더 커질 것 같아요. 지금도 충분히 흥미롭지만 확장 여지가 보여요.',
  '결과가 너무 진지하지만은 않아서 더 좋았습니다. 부담 없이 눌러보다가 예상보다 오래 머물렀네요.',
  '친구랑 커플 사진 느낌으로도 한번 해보고 싶어요. 같이 체험하면 확실히 반응이 더 클 것 같습니다.',
  '사이트 분위기가 차분하면서도 심심하지 않아서 좋았습니다. 테스트용 게시글도 금방 채워질 것 같네요.',
];

const getProjectId = () => {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }

  const firebasercPath = path.resolve(process.cwd(), '.firebaserc');
  if (fs.existsSync(firebasercPath)) {
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
    const defaultProject = firebaserc?.projects?.default;
    if (typeof defaultProject === 'string' && defaultProject.trim()) {
      return defaultProject.trim();
    }
  }

  return 'fitall-ver1';
};

const getCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return undefined;
  }

  return admin.credential.applicationDefault();
};

const initFirestore = () => {
  if (!admin.apps.length) {
    const projectId = getProjectId();
    const credential = getCredential();

    admin.initializeApp({
      projectId,
      ...(credential ? { credential } : {}),
    });
  }

  return admin.firestore();
};

const buildSeedPosts = () => {
  const now = new Date();

  return BOARD_POST_CONTENTS.map((content, index) => {
    const nickname = `user${String(index + 1).padStart(2, '0')}`;
    const hoursAgo = 2 + index * 7 + (index % 4) * 3;
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    return {
      nickname,
      content,
      tempPassword: DEFAULT_PASSWORD,
      deleted: false,
      createdAt,
      updatedAt: createdAt,
      seedBatch: SEED_BATCH,
      seedIndex: index + 1,
      seedSource: 'scripts/seedBoardPosts.js',
    };
  });
};

const printExamples = (posts) => {
  console.log('');
  console.log('Example posts:');
  posts.slice(0, 5).forEach((post) => {
    console.log(`- ${post.nickname} | ${post.createdAt.toISOString()} | ${post.content}`);
  });
};

const seedPosts = async () => {
  const db = initFirestore();
  const posts = buildSeedPosts();
  const batch = db.batch();

  posts.forEach((post) => {
    const ref = db.collection('bbsPosts').doc(`seed-${SEED_BATCH}-${post.nickname}`);
    batch.set(ref, {
      nickname: post.nickname,
      content: post.content,
      tempPassword: post.tempPassword,
      deleted: post.deleted,
      createdAt: admin.firestore.Timestamp.fromDate(post.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(post.updatedAt),
      seedBatch: post.seedBatch,
      seedIndex: post.seedIndex,
      seedSource: post.seedSource,
    });
  });

  await batch.commit();

  console.log(`Seeded ${posts.length} board posts into bbsPosts (batch: ${SEED_BATCH}).`);
  printExamples(posts);
};

const resetSeedPosts = async () => {
  const db = initFirestore();
  const snapshot = await db.collection('bbsPosts').where('seedBatch', '==', SEED_BATCH).get();

  if (snapshot.empty) {
    console.log(`No seeded board posts found for batch ${SEED_BATCH}.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`Deleted ${snapshot.size} seeded board posts from batch ${SEED_BATCH}.`);
};

const main = async () => {
  const args = new Set(process.argv.slice(2));
  const posts = buildSeedPosts();

  if (args.has('--dry-run')) {
    console.log(`Prepared ${posts.length} board posts for batch ${SEED_BATCH}.`);
    printExamples(posts);
    return;
  }

  if (args.has('--reset')) {
    await resetSeedPosts();
    return;
  }

  await seedPosts();
};

main().catch((error) => {
  console.error('Failed to seed board posts.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
