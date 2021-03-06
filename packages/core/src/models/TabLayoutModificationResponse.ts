/*
 * Copyright 2020 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity } from './entity'
import { ElsewhereCommentaryResponse } from './CommentaryResponse'

/**
 * If your controller wants to manipulate the tab layout, this is your
 * response type!
 *
 */
type TabLayoutModificationResponse<Request extends ModificationRequest = ModificationRequest> = {
  apiVersion: 'kui-shell/v1'
  kind: 'TabLayoutModificationResponse'
  spec: Request & {
    ok: ElsewhereCommentaryResponse
  }
}

export type NewSplitRequest = {
  modification: 'NewSplit'
  options?: {
    inverseColors?: boolean
  }
}

type ModificationRequest = NewSplitRequest /* TODO: | NewTabRequest | ClearConsoleRequest | ... */

export function isNewSplitRequest(
  req: TabLayoutModificationResponse
): req is TabLayoutModificationResponse<NewSplitRequest> {
  return req.spec.modification === 'NewSplit'
}

export function isTabLayoutModificationResponse(entity: Entity): entity is TabLayoutModificationResponse {
  const response = entity as TabLayoutModificationResponse
  return response && response.apiVersion === 'kui-shell/v1' && response.kind === 'TabLayoutModificationResponse'
}

export default TabLayoutModificationResponse
