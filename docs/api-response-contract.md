# API Response Contract

This note captures the observed difference between the current production Functions responses and the current repository code, and defines the compatibility contract the repo should preserve.

## Observed Production Responses

### `POST /api/bootstrap`

Observed live response example:

```json
{
  "success": true,
  "profile": {
    "dailyCredit": 300,
    "paidCredit": 0,
    "credits": 300,
    "totalGenerated": 0,
    "isSubscribed": false,
    "subscriptionPlan": "free",
    "role": "user"
  },
  "dailyRewardGranted": 300,
  "signupBonusGranted": 0,
  "subscriptionBonusGranted": 0,
  "generationCost": 100,
  "videoGenerationCost": 1000
}
```

Observed live response fields:

| Field | Production observed | Current repo before fix | Contract after fix |
| --- | --- | --- | --- |
| `success` | yes | yes | required |
| `profile.dailyCredit` | yes | yes | optional in type, expected at runtime |
| `profile.paidCredit` | yes | yes | optional in type, expected at runtime |
| `profile.credits` | yes | yes | optional in type, expected at runtime |
| `profile.totalGenerated` | yes | yes | optional in type, expected at runtime |
| `profile.isSubscribed` | yes | yes | optional in type |
| `profile.subscriptionPlan` | yes | yes | optional in type |
| `profile.role` | yes | yes | optional in type |
| `dailyRewardGranted` | yes | yes | required in Functions response |
| `signupBonusGranted` | yes | no | required in Functions response, default `0` if not used |
| `subscriptionBonusGranted` | yes | no | required in Functions response, default `0` if not used |
| `generationCost` | yes | yes | required |
| `videoGenerationCost` | yes | yes | required |

### `POST /api/tryon`

Observed live response example:

```json
{
  "success": true,
  "image": "data:image/png;base64,...",
  "mimeType": "image/png",
  "subjectType": "human",
  "creditsRemaining": 200,
  "dailyRewardGranted": 0,
  "signupBonusGranted": 0,
  "subscriptionBonusGranted": 0,
  "usedCreditType": "daily",
  "watermarkApplied": true,
  "dailyCredit": 200,
  "paidCredit": 0,
  "totalGenerated": 1
}
```

Observed live response fields:

| Field | Production observed | Current repo before fix | Contract after fix |
| --- | --- | --- | --- |
| `success` | yes | yes | required |
| `image` | yes | yes | required |
| `mimeType` | yes | yes | required |
| `subjectType` | yes | yes | required |
| `creditsRemaining` | yes | yes | required |
| `dailyRewardGranted` | yes | yes | required in Functions response |
| `signupBonusGranted` | yes | no | required in Functions response, default `0` if not used |
| `subscriptionBonusGranted` | yes | no | required in Functions response, default `0` if not used |
| `usedCreditType` | yes | yes | optional |
| `watermarkApplied` | yes | yes | optional |
| `dailyCredit` | yes | yes | optional |
| `paidCredit` | yes | yes | optional |
| `totalGenerated` | yes | yes | optional |

## Compatibility Rule

- Frontend must accept missing `dailyCredit`, `paidCredit`, `totalGenerated`, `usedCreditType`, and `watermarkApplied`.
- Functions should continue returning the richer local contract, but explicitly include `signupBonusGranted` and `subscriptionBonusGranted` for backward compatibility with production.
- Bonus fields default to `0` when no extra grant is applied.
