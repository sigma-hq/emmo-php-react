import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-[var(--emmo-green-primary)] text-white flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-white" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-bold text-[var(--emmo-green-primary)] dark:text-[var(--emmo-green-secondary)]">EMMO</span>
                <span className="text-xs text-muted-foreground truncate">Machinery Management</span>
            </div>
        </>
    );
}
