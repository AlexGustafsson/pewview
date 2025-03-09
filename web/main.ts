import { mount } from 'svelte'
import './main.css'
import App from './App.svelte'

const root = document.getElementById('root')
if (root) {
  mount(App, {
    target: document.getElementById('root')!,
  })
}
