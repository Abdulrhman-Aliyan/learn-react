/* What the learner's code can reach.
   Exercise source is compiled with these names already in scope, so an
   exercise never writes an import statement. Two of them are instrumented
   versions rather than the originals — see the guards below. */

import React from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import * as RQ from '@tanstack/react-query';
import * as RR from 'react-router-dom';

import { Runtime, guardSetter, guardStoreHook } from './runtime.js';
import { mockApi } from './mock-api.js';
import { useRenderCount, RenderBadge, StatusPill, JobRow, Panel, Spinner } from '../ui/widgets.js';

/* Identical API to React.useState, plus loop protection. An exercise that sets
   state on every render would otherwise take the tab down with it. */
function useStateGuarded(initial) {
  const pair = React.useState(initial);
  const set = pair[1];
  const wrapped = React.useCallback(function () {
    if (!guardSetter()) return;
    return set.apply(null, arguments);
  }, [set]);
  return [pair[0], wrapped];
}

/* create(), wrapped so the returned hook is rate-limited. getState/setState/
   subscribe are copied across, so the store API is otherwise unchanged. */
function createGuarded(initializer) {
  const useStore = create(initializer);
  function useGuardedStore(selector) {
    if (!guardStoreHook()) {
      throw new Error('Preview halted — see the note above the preview.');
    }
    return arguments.length === 0 ? useStore() : useStore(selector);
  }
  Object.assign(useGuardedStore, useStore);
  return useGuardedStore;
}

export const SANDBOX = {
  React: React,

  useState: useStateGuarded,
  useEffect: React.useEffect,
  useLayoutEffect: React.useLayoutEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useContext: React.useContext,
  useReducer: React.useReducer,
  useSyncExternalStore: React.useSyncExternalStore,
  useId: React.useId,
  useImperativeHandle: React.useImperativeHandle,
  useTransition: React.useTransition,
  useDeferredValue: React.useDeferredValue,
  startTransition: React.startTransition,
  createContext: React.createContext,
  forwardRef: React.forwardRef,
  memo: React.memo,
  Fragment: React.Fragment,
  Suspense: React.Suspense,

  create: createGuarded,
  useShallow: useShallow,

  useQuery: RQ.useQuery,
  useMutation: RQ.useMutation,
  useQueryClient: RQ.useQueryClient,
  useQueries: RQ.useQueries,
  QueryClient: RQ.QueryClient,
  QueryClientProvider: RQ.QueryClientProvider,
  keepPreviousData: RQ.keepPreviousData,

  /* Routing. MemoryRouter rather than BrowserRouter on purpose: the exercise
     runs inside the lab's own page, and a router that writes to the real URL
     would fight the lab for the address bar and break the back button. Memory
     history behaves identically for everything these lessons teach. */
  MemoryRouter: RR.MemoryRouter,
  Routes: RR.Routes,
  Route: RR.Route,
  Link: RR.Link,
  NavLink: RR.NavLink,
  Outlet: RR.Outlet,
  Navigate: RR.Navigate,
  useNavigate: RR.useNavigate,
  useParams: RR.useParams,
  useLocation: RR.useLocation,
  useSearchParams: RR.useSearchParams,
  useMatch: RR.useMatch,

  mockApi: mockApi,
  useRenderCount: useRenderCount,
  RenderBadge: RenderBadge,
  StatusPill: StatusPill,
  JobRow: JobRow,
  Panel: Panel,
  Spinner: Spinner,

  /* Writes to the sandbox log under the preview. Survives unmount, which is
     how you actually see a leaked timer still ticking. */
  log: function (msg) { Runtime.log('user', String(msg)); }
};

export const SANDBOX_NAMES = Object.keys(SANDBOX);
export const SANDBOX_VALUES = SANDBOX_NAMES.map(function (k) { return SANDBOX[k]; });
