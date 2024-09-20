"use client";

import { Suspense } from 'react';
import { useSession, signOut } from "next-auth/react";
import { redirect } from 'next/navigation';

import HomeClient from '../HomeClient.js';
import withAuth from "../hoc/withAuth.js";
import ShareButton from '@/components/ShareButton.js';


function Home({params}) {
    const {id}  = params;
    const appName = id;
    
    const { data: session } = useSession(); // Get session data

    if (!appName) {
        redirect('/');
    }

  

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
                {/* Flex container for title and user info */}
                <div className="flex justify-between items-center mb-2">
                    {/* Title aligned to the left */}
                    <h1 className="text-2xl font-bold">
                        <a href="/">llamaql (v0.1)</a>
                    </h1>

                    {/* User's name and logout button aligned to the right */}
                    <div className="flex items-center space-x-4">
                        <p className="text-lg">Welcome, {session.user?.name}!</p>
                        <ShareButton appName={appName} />

                        <button
                            onClick={() => signOut()}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" >
                            Sign out
                        </button>
                    </div>                    
                </div>

                {/* Main content */}
                <HomeClient appName={appName} />
            </div>

        </Suspense>
    );
}

export default withAuth(Home);
