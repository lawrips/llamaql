import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import HomeClient from './HomeClient';

export default function Home({ searchParams }) {
    const appName = searchParams.app;

    if (!appName) {
        redirect('/upload');
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HomeClient appName={appName} />
        </Suspense>
    );
}