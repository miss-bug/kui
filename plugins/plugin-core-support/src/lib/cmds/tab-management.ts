/*
 * Copyright 2018-2020 IBM Corporation
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

import {
  eventBus,
  getPrimaryTabId,
  i18n,
  KResponse,
  Registrar,
  NewTabRequestEvent,
  StatusStripeChangeEvent,
  Tab
} from '@kui-shell/core'

// TODO fixme; this is needed by a few tests
export const tabButtonSelector = '#new-tab-button'

const strings = i18n('plugin-core-support')
const usage = {
  strict: 'switch',
  command: 'switch',
  required: [{ name: 'tabIndex', numeric: true, docs: 'Switch to the given tab index' }]
}

/**
 * Close the current tab
 *
 */
function closeTab(tab: Tab, closeAllSplits: boolean) {
  const uuid = closeAllSplits ? getPrimaryTabId(tab) : tab.uuid
  eventBus.emitWithTabId('/tab/close/request', uuid, tab)
  return true
}

/**
 * The goal here is to offer a simple command structure for managing tabs
 *
 */
export default function plugin(commandTree: Registrar) {
  commandTree.listen(
    '/tab/switch',
    ({ argvNoOptions }) => {
      const idx = parseInt(argvNoOptions[argvNoOptions.length - 1], 10)
      eventBus.emit('/tab/switch/request', idx - 1)
      return true
    },
    { usage }
  )

  /**
   * Create and initialize a new tab
   *
   */
  commandTree.listen<
    KResponse,
    Pick<NewTabRequestEvent, 'cmdline' | 'title' | 'onClose'> & {
      /** Set the status stripe decorations */
      'status-stripe-type'?: StatusStripeChangeEvent['type']
      'status-stripe-message'?: string

      /** Open with qexec? */
      quiet?: boolean
      q?: boolean

      /** Open tab only if the given Kui command returns true */
      if?: string

      /** Open tab only if the given Kui command returns false */
      ifnot?: string

      /** Open tab in the background? I.e. without switching to it */
      bg?: boolean
    }
  >(
    '/tab/new',
    async args => {
      // handle conditional tab creation
      if (args.parsedOptions.if) {
        // conditional opening request
        const condition = await args.REPL.qexec<boolean>(args.parsedOptions.if)
        if (!condition) {
          return true
        }
      }
      if (args.parsedOptions.ifnot) {
        // conditional opening request
        const condition = await args.REPL.qexec<boolean>(args.parsedOptions.ifnot)
        if (condition) {
          return true
        }
      }

      // status stripe decorations
      const message =
        args.parsedOptions['status-stripe-message'] ||
        (args.execOptions.data ? args.execOptions.data['status-stripe-message'] : undefined)
      const statusStripeDecoration = { type: args.parsedOptions['status-stripe-type'], message }

      // this is our response to the user if the tab was created
      // successfully
      const ok = {
        apiVersion: 'kui-shell/v1',
        kind: 'CommentaryResponse',
        props: {
          elsewhere: true,
          tabUUID: '0',
          tab: undefined,
          children: args.parsedOptions.title
            ? strings('Created a new tab named X', args.parsedOptions.title)
            : strings('Created a new tab')
        }
      }

      if (args.parsedOptions.cmdline) {
        // caller wants to invoke a given command line in the new tab
        return new Promise(resolve => {
          eventBus.emit('/tab/new/request', {
            statusStripeDecoration,
            title: args.parsedOptions.title,
            background: args.parsedOptions.bg,
            cmdline: args.parsedOptions.cmdline,
            exec: args.parsedOptions.quiet ? 'qexec' : 'pexec',
            onClose: args.parsedOptions.onClose
          })

          resolve(ok)
        })
      } else {
        // default case: tab opens without invoking a command line
        eventBus.emit('/tab/new/request', {
          statusStripeDecoration,
          title: args.parsedOptions.title,
          background: args.parsedOptions.bg,
          onClose: args.parsedOptions.onClose
        })
        return ok
      }
    },
    {
      outputOnly: true,
      usage: {
        optional: [
          { name: '--cmdline', alias: '-c', docs: 'Invoke a command in the new tab' },
          { name: '--quiet', alias: '-q', boolean: true, docs: 'Execute the given command line quietly' },
          { name: '--bg', alias: '-b', boolean: true, docs: 'Create, but do not switch to this tab' },
          { name: '--status-stripe-type', docs: 'Desired status stripe coloration', allowed: ['default', 'blue'] },
          { name: '--status-stripe-message', docs: 'Desired status stripe message' },
          { name: '--title', alias: '-t', docs: 'Title to display in the UI' }
        ]
      },
      flags: {
        boolean: ['bg', 'b', 'quiet', 'q']
      }
    }
  )

  commandTree.listen<KResponse, { A: boolean }>(
    '/tab/close',
    ({ tab, parsedOptions }) => {
      return closeTab(tab, parsedOptions.A)
    },
    { flags: { boolean: ['A'] } }
  )
}
