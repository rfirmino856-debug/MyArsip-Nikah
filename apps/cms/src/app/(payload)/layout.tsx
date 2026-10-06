import configPromise from '@/payload.config';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import { importMap } from './admin/importMap';
import React from 'react';
import '@payloadcms/next/css';
import './admin.css';

type Args = {
  children: React.ReactNode;
};

const serverFunction = async (args: any) => {
  'use server';
  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={configPromise} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
