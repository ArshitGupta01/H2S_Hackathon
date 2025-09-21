
import React, { memo } from 'react';

export const Footer: React.FC = memo(() => {
    return (
        <footer className="w-full text-center py-8 mt-16 border-t border-card-border/50">
            <p className="text-sm text-text-secondary">
                Powered by AI, designed for your future.
            </p>
            <p className="text-sm text-text-secondary mt-2">
                Crafted with ❤️ by Team Epsilon
            </p>
        </footer>
    );
});
