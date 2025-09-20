// src/components/ResponsiveWrapper.js
import React from "react";

const ResponsiveWrapper = ({ children }) => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {children}
    </div>
  );
};

export default ResponsiveWrapper;
