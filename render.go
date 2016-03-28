package widget

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/qor/qor/utils"
	"html/template"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// Render find a widget and render this widget
func (widgetInstance *WidgetInstance) Render(key string, context *Context, availableWidgets ...string) template.HTML {
	if len(availableWidgets) == 0 {
		utils.ExitWithMsg("Widget Name can't be blank")
	}
	widgetName := availableWidgets[0]
	widgetObj, _ := GetWidget(widgetName)
	setting := findSettingByNameAndKey(widgetInstance.Config.DB, widgetObj.Name, key)
	settingValue := setting.GetSerializableArgument(setting)
	newContext := widgetObj.Context(context, settingValue)
	url := widgetInstance.settingEditURL(setting)
	return widgetObj.Render(newContext, url)
}

func (widgetInstance *WidgetInstance) settingEditURL(setting *QorWidgetSetting) string {
	prefix := widgetInstance.SettingResource.GetAdmin().GetRouter().Prefix
	return fmt.Sprintf("%v/%v/%v/edit", prefix, widgetInstance.SettingResource.ToParam(), setting.ID)
}

// Render register widget itself content
func (w *Widget) Render(context *Context, url string) template.HTML {
	var err error
	var result = bytes.NewBufferString("")
	file := w.Template

	defer func() {
		if r := recover(); r != nil {
			err = errors.New(fmt.Sprintf("Get error when render file %v: %v", file, r))
			utils.ExitWithMsg(err)
		}
	}()

	if file, err = w.findTemplate(file + ".tmpl"); err == nil {
		if tmpl, err := template.New(filepath.Base(file)).ParseFiles(file); err == nil {
			if err = tmpl.Execute(result, context.Options); err == nil {
				return template.HTML(fmt.Sprintf("<div class=\"qor-widget qor-widget-%v\" data-url=\"%v\">\n%v\n</div>", w.nameForClass(), url, result.String()))
			}
		}
	}

	return template.HTML(err.Error())
}

// RegisterViewPath register views directory
func (widgetInstance *WidgetInstance) RegisterViewPath(p string) {
	for _, gopath := range strings.Split(os.Getenv("GOPATH"), ":") {
		if registerViewPath(path.Join(gopath, "src", p)) == nil {
			return
		}
	}
}

func isExistingDir(pth string) bool {
	fi, err := os.Stat(pth)
	if err != nil {
		return false
	}
	return fi.Mode().IsDir()
}

func registerViewPath(path string) error {
	if isExistingDir(path) {
		var found bool

		for _, viewPath := range viewPaths {
			if path == viewPath {
				found = true
				break
			}
		}

		if !found {
			viewPaths = append(viewPaths, path)
		}
		return nil
	}
	return errors.New("path not found")
}

func (w *Widget) findTemplate(layouts ...string) (string, error) {
	for _, layout := range layouts {
		for _, p := range viewPaths {
			if _, err := os.Stat(filepath.Join(p, layout)); !os.IsNotExist(err) {
				return filepath.Join(p, layout), nil
			}
		}
	}
	return "", fmt.Errorf("template not found: %v", layouts)
}
