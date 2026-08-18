import { NavLink, Outlet } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Navbar';

export function SettingsLayout() {
    const tabClass = ({ isActive }: { isActive: boolean }) =>
        `border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive
            ? 'border-accent text-text-primary'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        }`;

    return (
        <PageContainer className="py-10">
            <div>
                <h1 className="font-serif text-2xl font-semibold text-text-primary">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                    Manage your public profile and account details.
                </p>
            </div>

            <div className="mt-6 border-b border-border-subtle">
                <nav className="-mb-px flex items-center gap-2">
                    <NavLink to="profile" className={tabClass}>
                        Profile
                    </NavLink>

                    <NavLink to="password" className={tabClass}>
                        Password
                    </NavLink>
                </nav>
            </div>

            <div className="mt-8">
                <Outlet />
            </div>
        </PageContainer>
    );
}