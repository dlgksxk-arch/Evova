# GitHub AAB Build

Play Console 내부 테스트 업로드용 `AAB` 파일은 GitHub에서 만들 수 있습니다.

## 1. GitHub Secrets 4개 추가

저장소 `Settings > Secrets and variables > Actions` 에 아래 값을 추가합니다.

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## 2. GitHub에서 AAB 만들기

`Actions > Android AAB > Run workflow`

입력값 추천:

- `release_name`: `0.1.0-internal`
- `version_name`: `0.1.0`
- `version_code`: `1`

완료되면 아티팩트 이름은 `hamdeva-0.1.0-internal-aab` 형태로 생성됩니다.

## 3. Play Console에 업로드

Play Console 내부 테스트에서 `App Bundle` 업로드 칸에 내려받은 `.aab` 파일을 넣으면 됩니다.

## 4. 지금 남은 실제 준비물

현재 가장 중요한 건 안드로이드 업로드 키입니다. 이 키를 먼저 만든 뒤 위 4개 값을 GitHub Secrets에 넣어야 AAB가 정상 생성됩니다.
