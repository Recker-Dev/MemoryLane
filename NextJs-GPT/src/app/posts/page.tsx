'use client';

import React, { useEffect, useState, useRef } from 'react';

// This component displays a list of names, each as a button with a heart icon.
export default function PostPage() {

  const names = ['Ada Lovelace', 'Grace Hopper', 'Margaret Hamilton',];
  const [likes,setLikes] = useState<Record<string,number>>(()=>{
    const initiallikes : Record<string,number> = {};
    names.forEach((name: string)=>{
        initiallikes[name] = 0;
    }); 
    return initiallikes;
  }
  );

  const [showNotification,setShowNotification] = useState<boolean>(false);

  // ✅ Ref to hold the timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(()=>{
    console.log("Updated Likes", likes);
  }, [likes]);

 function clickHandler(event:React.FormEvent<HTMLButtonElement>)
 {
        if (event.currentTarget.dataset.key === undefined) {
            return; //takes care of incase no data-key
        }
        const key: string = event.currentTarget.dataset.key;
        // To get the text of the clicked button, you can access the target element
        console.log("Clicked button text:",key );
        // Current updated likes
        
        // Update likes
        setLikes(prevLikes=>({
            ...prevLikes,
            [key]:prevLikes[key]+1
        }));
        
        // NEW LOGIC: Show notification and hide after 2 seconds
        setShowNotification(true);

        // ✅ Clear any previous timer
        if (timeoutRef.current){
            clearTimeout(timeoutRef.current);
        }

        // ✅ Set new timer
        timeoutRef.current = setTimeout(()=>{
            setShowNotification(false);}
        ,2000);

        
            
 }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center justify-center p-4 font-geist-sans">
      {/* NEW: Notification component, conditionally rendered and animated */}
      <div className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        bg-blue-950 text-white font-bold px-6 py-3 rounded-full
        transition-all duration-500 ease-in-out transform
        ${showNotification ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        shadow-xl border border-blue-800 whitespace-nowrap
      `}>
        Thanks for liking! ❤️
      </div>
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg">
        Pioneers in Tech    
      </h1>
      <div className="w-full max-w-md">
        {names.map((name) => (
          // Each name is a button with a modern, interactive style.
          <button
            key={name}
            data-key={name}
            onClick={clickHandler}
            className="w-full flex items-center justify-between px-6 py-4 mb-4 bg-gray-700 rounded-xl shadow-lg hover:bg-gray-600 transition-all duration-300 ease-in-out transform hover:scale-105
                       focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-75 group cursor-pointer"
            aria-label={`View details for ${name}`}
          >
            <span className="text-xl md:text-2xl font-medium text-gray-50 group-hover:text-purple-200">
              {name}
            </span>
            {/* Heart icon with adjusted color for contrast and like count */}
            <span className="text-2xl md:text-3xl text-red-500 flex items-center">
              ❤️
              <span className="ml-2 text-xl font-bold text-gray-400">
                {likes[name]} {/* Display the current like count */}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
