import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { T } from "./i18n/I18nProvider";

export function ArchivePageFooter({ title }: { title: string }) {
  return (
    <footer className="mx-auto max-w-[820px] px-5 pb-12 pt-4 text-[13px] leading-6 text-muted lg:px-8">
      <div className="border-t border-border-strong pt-6">
        <div>
          <p>
            <T k="footer.pagePart" values={{ title }} />
          </p>
          <p>
            <T k="footer.published" />
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-5">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              <T k="theme.theme" />
            </h2>
            <ThemeSwitcher />
          </section>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">
              <T k="language.language" />
            </h2>
            <LanguageSwitcher compact />
          </section>
        </div>
      </div>
    </footer>
  );
}
