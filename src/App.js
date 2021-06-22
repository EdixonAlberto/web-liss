import draggable from './draggable'
import widgetList from './data/widgetList.json'
import dates from './data/dates.json'

Vue.component('AppWindow', {
  template: '#app-window',

  props: {
    dataWindow: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      showWindow: true,
      maximizeWindow: false,
      browserInput: 'https://www.google.com',
      browserUrl: 'https://www.google.com/webhp?igu=1'
    }
  },

  computed: {
    styleCustom() {
      return {
        zIndex: 1000 + this.dataWindow.z,
        ...this.dataWindow.position
      }
    }
  },

  methods: {
    maximize() {
      this.$refs.appWindow.style.transition = 'all 0.15s ease-in-out'
      this.maximizeWindow = !this.maximizeWindow
      this.$emit('maximized-window')
    },

    updateFocus() {
      const newAppWindow = {
        ...this.dataWindow,
        focus: !this.dataWindow.focus
      }

      this.$emit('update-window', newAppWindow)
    },

    updatePosition(evt) {
      // TODO: mejorar actualizacion de la posicion por medio del evento
      // console.log(evt.button, evt.buttons)

      const appWindow = this.$refs.appWindow

      if (appWindow) {
        const newAppWindow = {
          ...this.dataWindow,
          position: {
            top: appWindow.style.top,
            right: appWindow.style.right,
            bottom: appWindow.style.bottom,
            left: appWindow.style.left
          }
        }

        this.$emit('update-window', newAppWindow)
      }
    },

    setBrowserUrl(input = '') {
      let inputUrl = input || this.browserInput
      const isGoogle = inputUrl.search(/google.com$/) > -1

      inputUrl = isGoogle ? 'www.google.com' : inputUrl
      this.browserInput = `https://${inputUrl}`

      inputUrl = isGoogle ? 'google.com/webhp?igu=1' : inputUrl
      this.browserUrl = `https://${inputUrl}`
    }
  },

  mounted() {
    const { appWindow } = this.$refs
    const appHeader = appWindow.children[0]
    const buttons = appHeader.children[2]
    const header = document.querySelector('header')

    const offsetPosition = {
      left: 0,
      top: header.clientHeight
    }

    draggable(appWindow, appHeader, buttons, offsetPosition)
  }
})

Vue.component('AppFolder', {
  template: '#app-folder',

  mounted() {
    const header = document.querySelector('header')
    const widgetSide = document.querySelector('section.widget-side')

    const offsetPosition = {
      left: widgetSide.clientWidth,
      top: header.clientHeight
    }

    draggable(this.$refs.appFolder, null, null, offsetPosition)
  }
})

new Vue({
  el: '#app',

  data() {
    return {
      // TODO: guardar config en localstore
      date: new Date(),
      desktops: [1, 2, 3],
      desktop: 1,
      brightness: 8,
      isMaximizedWindow: false,
      appWindowList: [],
      widgetList,
      isLock: null
    }
  },

  computed: {
    dateDynamic() {
      const [weeks, months] = dates

      const d = this.date
      const hours = d.getHours() < 10 ? '0' + d.getHours() : d.getHours()
      const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()
      const days = d.getDate() < 10 ? '0' + d.getDate() : d.getDate()

      // prettier-ignore
      const fullDate = `${weeks[d.getDay()]} ${months[d.getMonth()]} ${days}, ${hours}:${minutes}`
      // prettier-ignore
      const fullDateLock = `${weeks[d.getDay()]}, ${months[d.getMonth()]} ${days}, ${d.getFullYear()}`

      return { fullDate, fullDateLock, hours, minutes }
    },

    isMobile() {
      return window.screen.width < 768
    }
  },

  methods: {
    initDateDynamic() {
      setInterval(() => (this.date = new Date()), 1000 * 60)
    },

    openDircord() {
      open('https://discord.com/app', 'newwindow', 'width=700,height=600')
    },

    getId() {
      return new Date().getTime().toString().substr(-3)
    },

    getPosition(quadrant) {
      const sizeHeader = '30px'

      switch (quadrant) {
        case 0:
          return { top: sizeHeader, left: '0' }
        case 1:
          return { top: sizeHeader, right: '0' }
        case 2:
          return { bottom: '0', left: '0' }
        case 3:
          return { bottom: '0', right: '0' }
        case 4:
          return {
            top: `calc(50% - (100vh / 2 - ${sizeHeader} / 2) / 2 + ${sizeHeader})`,
            left: `calc(50% - (100vw / 2) / 2)`
          }
      }
    },

    createAppWindow(newAppWindow) {
      const windowNotRepeted = !this.appWindowList.length
        ? true
        : !this.appWindowList.some(appWindow => appWindow.type === newAppWindow.type)

      if (windowNotRepeted) {
        const appWindowList = this.appWindowList.map(appWindow => ({
          ...appWindow,
          z: 0
        }))

        appWindowList.push({
          ...newAppWindow,
          id: this.getId(),
          z: 4,
          focus: true,
          position: this.getPosition(this.appWindowList.length)
        })

        this.appWindowList = appWindowList
      } else {
        this.appWindowList = this.appWindowList.map(appWindow => {
          return appWindow.type === newAppWindow.type
            ? {
                ...appWindow,
                focus: !appWindow.focus
              }
            : appWindow
        })
      }
    },

    deleteAppWindow(appWindowId) {
      this.appWindowList = this.appWindowList.filter(
        appWindow => appWindow.id !== appWindowId
      )
    },

    updateDistributionWindow(newAppWindow) {
      this.appWindowList.forEach(appWindow => {
        if (newAppWindow.id === appWindow.id) appWindow.z = 4
        else if (appWindow.z > 0) appWindow.z -= 1
      })
    },

    updateWindow(appWindow) {
      this.appWindowList = this.appWindowList.map(item => {
        return item.id === appWindow.id ? appWindow : item
      })
    },

    isWidgetActived(windowType) {
      const widgetIndex = this.appWindowList.findIndex(
        appWindow => appWindow.type === windowType
      )
      return widgetIndex > -1
    },

    handlerLock(action) {
      const removeEvent = () => document.removeEventListener('keypress', null)

      switch (action) {
        case 'lock':
          this.desktop = 1
          this.isLock = true

          document.addEventListener('keypress', () => {
            this.isLock = false
            removeEvent()
          })
          break

        case 'unlock':
          this.isLock = false
          removeEvent()
          break
      }
    }
  },

  created() {
    this.initDateDynamic()
  }
})
