import { createSignal } from 'solid-js'
import { Eye, Lock, Mail, Search, User } from 'lucide-solid'
import { AppInput, AppTextArea } from '@/components/ui'
import { Block, Cell, createKnobs, DevSection, jsxSnippet, Playground, Preview, type DevSectionMeta } from '../knobs'

export const meta: DevSectionMeta = { id: 'inputs', title: 'AppInput · AppTextArea', group: 'Forms' }

export function InputsSection() {
  const knobs = createKnobs(
    {
      label: { type: 'text' },
      placeholder: { type: 'text' },
      hint: { type: 'text' },
      error: { type: 'text' },
      type: { type: 'select', options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date'] },
      leftIcon: { type: 'boolean' },
      rightIcon: { type: 'boolean' },
      required: { type: 'boolean' },
      disabled: { type: 'boolean' },
      readOnly: { type: 'boolean' },
    },
    {
      label: 'E-posta',
      placeholder: 'ornek@site.com',
      hint: '',
      error: '',
      type: 'email',
      leftIcon: true,
      rightIcon: false,
      required: false,
      disabled: false,
      readOnly: false,
    },
  )
  const ta = createKnobs(
    {
      label: { type: 'text' },
      rows: { type: 'number', min: 2, max: 12, step: 1 },
      maxLength: { type: 'number', min: 0, max: 1000, step: 10 },
      showCount: { type: 'boolean' },
      autoResize: { type: 'boolean' },
      error: { type: 'text' },
      disabled: { type: 'boolean' },
    },
    { label: 'Hakkında', rows: 4, maxLength: 280, showCount: true, autoResize: false, error: '', disabled: false },
  )
  const [text, setText] = createSignal('')

  return (
    <DevSection
      meta={meta}
      description="Kobalte TextField üzerine: label / hint / error aria bağlantıları otomatik. `onChange(value: string)` her tuşta tetiklenir."
      imports="import { AppInput, AppTextArea } from '@/components/ui'"
    >
      <Block title="AppInput playground">
        <Playground
          knobs={knobs}
          previewAlign="stretch"
          render={(v) => (
            <AppInput
              label={v.label}
              placeholder={v.placeholder}
              hint={v.hint}
              error={v.error}
              type={v.type}
              required={v.required}
              disabled={v.disabled}
              readOnly={v.readOnly}
              leftIcon={v.leftIcon ? <Mail /> : undefined}
              rightIcon={v.rightIcon ? <Eye /> : undefined}
              class="max-w-md"
            />
          )}
          code={(v) =>
            jsxSnippet(
              'AppInput',
              {
                ...v,
                leftIcon: v.leftIcon ? '{<Mail />}' : undefined,
                rightIcon: v.rightIcon ? '{<Eye />}' : undefined,
              },
              { defaults: { type: 'text' } },
            ).replace(/"\{(<[^"]+>)\}"/g, '{$1}')
          }
        />
      </Block>

      <Block title="AppTextArea playground">
        <Playground
          knobs={ta}
          previewAlign="stretch"
          render={(v) => (
            <AppTextArea
              label={v.label}
              rows={v.rows}
              maxLength={v.maxLength || undefined}
              showCount={v.showCount}
              autoResize={v.autoResize}
              error={v.error}
              disabled={v.disabled}
              value={text()}
              onChange={setText}
              placeholder="Kısa bir tanıtım yazın…"
              class="max-w-md"
            />
          )}
          code={(v) =>
            jsxSnippet('AppTextArea', { ...v, maxLength: v.maxLength || undefined }, { defaults: ta.defaults })
          }
        />
      </Block>

      <Block title="States">
        <Preview align="start" class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3">
          <Cell label="default">
            <AppInput label="Ad" placeholder="Adınız" />
          </Cell>
          <Cell label="required + hint">
            <AppInput label="Kullanıcı adı" required hint="Profil adresinizde görünür." leftIcon={<User />} />
          </Cell>
          <Cell label="error">
            <AppInput label="E-posta" value="yanlis@" error="Geçerli bir e-posta girin" leftIcon={<Mail />} />
          </Cell>
          <Cell label="disabled">
            <AppInput label="Şirket" value="PSB Tech" disabled />
          </Cell>
          <Cell label="readOnly">
            <AppInput label="ID" value="01HXP1234" readOnly />
          </Cell>
          <Cell label="password + right icon">
            <AppInput label="Şifre" type="password" value="secret123" leftIcon={<Lock />} rightIcon={<Eye />} />
          </Cell>
          <Cell label="search, no label">
            <AppInput placeholder="İlan, şirket…" leftIcon={<Search />} type="search" />
          </Cell>
          <Cell label="date">
            <AppInput label="Başlangıç" type="date" />
          </Cell>
          <Cell label="number">
            <AppInput label="Maaş" type="number" placeholder="0" rightIcon={<span class="text-xs">₺</span>} />
          </Cell>
        </Preview>
      </Block>
    </DevSection>
  )
}
