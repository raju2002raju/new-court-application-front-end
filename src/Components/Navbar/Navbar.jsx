import React from 'react'

const Navbar = () => {
  return (
    <div className='flex justify-between p-4'>
      <div>
        <img className='max-w-10 rounded'  src='/Images/logo.png'/>
      </div>
      <div>
        <ul className='flex gap-5'>
            <li>HOME</li>
            <li>MY DOCUMENT</li>
            <li>LOGOUT</li>
        </ul>
      </div>
    </div>
  )
}

export default Navbar
