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

import { dirname } from 'path'

import { Common, CLI, ReplExpect, Selectors, Util } from '@kui-shell/test'

const ROOT = dirname(require.resolve('@kui-shell/plugin-core-support/package.json'))

describe('commentary and replay', function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  const verifyComment = () => {
    return this.app.client.waitUntil(async () => {
      await this.app.client.waitForVisible(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD}`)

      const title = await this.app.client.getText(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD_TITLE}`)
      const head1 = await this.app.client.getText(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD} h1`)
      const head2 = await this.app.client.getText(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD} h2`)

      return (
        title === 'hello there' && head1 === 'The Kui Framework for Graphical Terminals' && head2 === 'Installation'
      )
    }, CLI.waitTimeout)
  }

  const addComment = () => {
    it('should show comment with file', () =>
      CLI.command(`commentary --title "hello there" -f=${ROOT}/tests/data/comment.md`, this.app)
        .then(() => verifyComment())
        .catch(Common.oops(this, true)))
  }

  addComment()
  it('should show version', () =>
    CLI.command('version', this.app)
      .then(ReplExpect.okWithCustom({ expect: Common.expectedVersion }))
      .catch(Common.oops(this, true)))
  addComment()

  it('should snapshot', () =>
    CLI.command('snapshot /tmp/test.kui', this.app)
      .then(ReplExpect.justOK)
      .catch(Common.oops(this, true)))

  it('should refresh', () => Common.refresh(this))

  it('should replay', () =>
    CLI.command('replay /tmp/test.kui', this.app)
      .then(() => verifyComment())
      .catch(Common.oops(this, true)))
})

describe('edit commentary and replay', function(this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  const verifyComment = (expectedText: string) => {
    let idx = 0
    return this.app.client.waitUntil(async () => {
      await this.app.client.waitForVisible(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD}`)
      const actualText = await this.app.client.getText(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD}`)

      if (++idx > 5) {
        console.error(`still waiting for actual=${actualText} expected=${expectedText}`)
      }

      return actualText === expectedText
    }, CLI.waitTimeout)
  }

  const verifyTextInMonaco = (expectedText: string) => {
    let idx = 0
    return this.app.client.waitUntil(async () => {
      const actualText = await Util.getValueFromMonaco(this.app, Selectors.OUTPUT_LAST)

      if (++idx > 5) {
        console.error(`still waiting for actual=${actualText} expected=${expectedText}`)
      }

      return actualText === expectedText
    }, CLI.waitTimeout)
  }

  /** set the monaco editor text */
  const type = async (text: string): Promise<void> => {
    const selector = `${Selectors.OUTPUT_LAST} .monaco-editor-wrapper .view-lines`
    await this.app.client.click(selector).then(() => this.app.client.waitForEnabled(selector))

    await this.app.client.keys(text)
  }
  const typeAndVerify = (text: string, expect: string) => {
    it(`should type ${text} and expect ${expect} in the comment`, async () => {
      try {
        await type(text)
        await verifyTextInMonaco(expect)
      } catch (err) {
        await Common.oops(this, true)(err)
      }
    })
  }
  const openEditor = (expect: string) => {
    it('should open editor by clicking', async () => {
      try {
        await this.app.client.doubleClick(`${Selectors.OUTPUT_LAST} ${Selectors.TERMINAL_CARD}`)
        await verifyTextInMonaco(expect)
      } catch (err) {
        await Common.oops(this, true)(err)
      }
    })
  }
  const clickDone = (expect: string) => {
    it('should close the editor by clicking the Done button', async () => {
      try {
        await this.app.client.click(`${Selectors.OUTPUT_LAST} ${Selectors.COMMENTARY_EDITOR_BUTTON_DONE}`)
        await this.app.client.waitForVisible(`${Selectors.OUTPUT_LAST} ${Selectors.COMMENTARY_EDITOR}`, 500, true)
        await verifyComment(expect)
      } catch (err) {
        await Common.oops(this, true)(err)
      }
    })
  }
  const clickRevert = (expect: string) => {
    it('should revert the editor by clicking the Revert button', async () => {
      try {
        await this.app.client.click(`${Selectors.OUTPUT_LAST} ${Selectors.COMMENTARY_EDITOR_BUTTON_REVERT}`)
        await this.app.client.waitForVisible(`${Selectors.OUTPUT_LAST} ${Selectors.COMMENTARY_EDITOR}`) // still open!
        await verifyTextInMonaco(expect)
      } catch (err) {
        await Common.oops(this, true)(err)
      }
    })
  }
  const clickCancel = (expect: string) => {
    it('should close the editor by clicking the Cancel button', async () => {
      try {
        await this.app.client.click(`${Selectors.OUTPUT_LAST} ${Selectors.COMMENTARY_EDITOR_BUTTON_CANCEL}`)
        await this.app.client.waitForVisible(`${Selectors.OUTPUT_LAST} ${Selectors.COMMENTARY_EDITOR}`, 500, true)
        await verifyComment(expect)
      } catch (err) {
        await Common.oops(this, true)(err)
      }
    })
  }

  /** Here comes the test */
  it('should add comment', () =>
    CLI.command(`# foo`, this.app)
      .then(() => verifyComment('foo'))
      .catch(Common.oops(this, true)))

  openEditor('foo')
  typeAndVerify('1', 'foo1')
  clickDone('foo1')

  openEditor('foo1')
  typeAndVerify('2', 'foo12')
  clickCancel('foo1')

  openEditor('foo1')
  typeAndVerify('3', 'foo13')
  clickRevert('foo1')
  clickCancel('foo1')

  it('should snapshot', () =>
    CLI.command('snapshot /tmp/test.kui', this.app)
      .then(ReplExpect.justOK)
      .catch(Common.oops(this, true)))

  it('should refresh', () => Common.refresh(this))

  it('should replay', () =>
    CLI.command('replay /tmp/test.kui', this.app)
      .then(() => verifyComment('foo1'))
      .catch(Common.oops(this, true)))
})
