<template>
    <div :class="{'has-logo':showLogo}" :style="{ backgroundColor: settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
        <logo v-if="showLogo" :collapse="isCollapse" />
        <el-scrollbar :class="settings.sideTheme" wrap-class="scrollbar-wrapper">
            <el-menu
                :default-active="activeMenu"
                :collapse="isCollapse"
                :background-color="settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground"
                :text-color="settings.sideTheme === 'theme-dark' ? variables.menuColor : variables.menuLightColor"
                :unique-opened="true"
                :active-text-color="settings.theme"
                :collapse-transition="false"
                active-text-color="#ffffff"
                mode="vertical"
            >
                <sidebar-item
                    v-for="(route, index) in sidebarRouters"
                    :key="route.path  + index"
                    :item="route"
                    :base-path="route.path"
                />
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import Logo from "./Logo";
import SidebarItem from "./SidebarItem";
import variables from "@/assets/styles/variables.scss";
import {dynamicRoutes} from "@/router";

export default {
    components: { SidebarItem, Logo },
    computed: {
        ...mapState(["settings"]),
        ...mapGetters(["sidebarRouters", "sidebar"]),
        activeMenu() {
            const route = this.$route;
            const { meta, path } = route;
            // if set path, the sidebar will highlight the path you set
            if (meta.activeMenu) {
                return meta.activeMenu;
            }
            return path;
        },
        showLogo() {
            return this.$store.state.settings.sidebarLogo;
        },
        variables() {
            return variables;
        },
        isCollapse() {
            return !this.sidebar.opened;
        }
    },
  mounted() {
    console.log("Sidebar Routes:", JSON.parse(JSON.stringify(this.sidebarRouters)));
  }
};
</script>
<style lang="scss" scoped>
// 给最外层div添加样式
div {
  margin: 0px;  // 给圆角留出空间
  border-radius: 12px;  // 设置圆角

  overflow: hidden;  // 防止内容溢出
  height: 100%;  // 改为100%

  // 当有logo时的样式调整
  &.has-logo {
    .el-scrollbar {
      height: calc(100% - 50px);  // 50px是logo的高度
    }
  }
}

// 调整滚动条容器样式
.el-scrollbar {
  height: 100%;

  ::v-deep .scrollbar-wrapper {
    overflow-x: hidden;
  }
}

// 确保菜单样式正常
::v-deep .el-menu {
  border-right: none;

  // 确保选中状态的文字颜色
  .el-menu-item.is-active {
    color: #ffffff !important;
  }

  // 子菜单选中状态的文字颜色
  .el-submenu .el-menu-item.is-active {
    color: #ffffff !important;
  }
}
</style>
