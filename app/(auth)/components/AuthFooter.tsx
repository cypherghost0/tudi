'use client';

export function AuthFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="container mx-auto px-4 py-3">
                <div className="text-center text-sm text-muted-foreground">
                    © {currentYear} Bayingana. All rights reserved.
                </div>
            </div>
        </footer>
    );
}