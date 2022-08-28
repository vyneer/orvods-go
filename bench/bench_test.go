package bench

import (
	jsonStd "encoding/json"
	"fmt"
	"html"
	"strings"
	"testing"
	"time"

	"github.com/bytedance/sonic/encoder"
	jsoniter "github.com/json-iterator/go"
	"github.com/vyneer/orvods-go/parser"
)

var json = jsoniter.ConfigCompatibleWithStandardLibrary
var fastestJson = jsoniter.ConfigFastest

// var urls string = "[\"https://dgg.overrustlelogs.net/Destinygg%20chatlog/April%202021/2021-04-09.txt\",\"https://dgg.overrustlelogs.net/Destinygg%20chatlog/April%202021/2021-04-10.txt\"]"
var from string = "2021-04-09 19:08:46 UTC"
var to string = "2021-04-10 04:50:52 UTC"

func ParseChatOld(chatlines []string) map[string][]parser.Dictionary {
	chatHash := make(map[string][]parser.Dictionary)

	for _, chatLine := range chatlines {
		index := strings.Index(chatLine, ": ")
		length := len(chatLine)

		timestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", chatLine[1:24])
		timestamp1 := timestamp.Format(time.RFC3339)
		username := chatLine[26:index]
		message := html.EscapeString(chatLine[index+2 : length])
		buf := chatHash[timestamp1]
		buf = append(buf, parser.Dictionary{"message": message, "username": username})
		chatHash[timestamp1] = buf
	}

	return chatHash
}

func ParseChatPrealloc(chatlines []string) map[string][]parser.Dictionary {
	chatHash := make(map[string][]parser.Dictionary, len(chatlines))

	for _, chatLine := range chatlines {
		index := strings.Index(chatLine, ": ")
		length := len(chatLine)

		timestampSplit := strings.SplitN(chatLine[1:24], " ", 3)
		timestampFormatted := fmt.Sprintf("%sT%sZ", timestampSplit[0], timestampSplit[1])
		username := chatLine[26:index]
		message := html.EscapeString(chatLine[index+2 : length])
		chatHash[timestampFormatted] = append(chatHash[timestampFormatted], parser.Dictionary{"message": message, "username": username})
	}

	return chatHash
}

func ParseChatInt(chatlines []string) map[int64][]parser.Dictionary {
	chatHash := make(map[int64][]parser.Dictionary)

	for _, chatLine := range chatlines {
		index := strings.Index(chatLine, ": ")
		length := len(chatLine)

		timestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", chatLine[1:24])
		timestampFormatted := timestamp.Unix()
		username := chatLine[26:index]
		message := html.EscapeString(chatLine[index+2 : length])
		chatHash[timestampFormatted] = append(chatHash[timestampFormatted], parser.Dictionary{"message": message, "username": username})
	}

	return chatHash
}

func ParseChatIntPrealloc(chatlines []string) map[int64][]parser.Dictionary {
	chatHash := make(map[int64][]parser.Dictionary, len(chatlines))

	for _, chatLine := range chatlines {
		index := strings.Index(chatLine, ": ")
		length := len(chatLine)

		timestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", chatLine[1:24])
		timestampFormatted := timestamp.Unix()
		username := chatLine[26:index]
		message := html.EscapeString(chatLine[index+2 : length])
		chatHash[timestampFormatted] = append(chatHash[timestampFormatted], parser.Dictionary{"message": message, "username": username})
	}

	return chatHash
}

func BenchmarkNewParse(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		parser.ParseChat(chatlines)
	}
}

func BenchmarkPreallocParse(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParseChatPrealloc(chatlines)
	}
}

func BenchmarkIntParse(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParseChatInt(chatlines)
	}
}

func BenchmarkIntPreallocParse(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParseChatIntPrealloc(chatlines)
	}
}

func BenchmarkOldParse(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ParseChatOld(chatlines)
	}
}

func BenchmarkJsonRegular(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		res := ParseChatInt(chatlines)
		jsonStd.Marshal(res)
	}
}

func BenchmarkJsonFast(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		res := ParseChatInt(chatlines)
		jsoniter.Marshal(res)
	}
}

func BenchmarkJsonFastest(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		res := ParseChatInt(chatlines)
		fastestJson.Marshal(res)
	}
}

func BenchmarkJsonSonic(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		res := ParseChatInt(chatlines)
		encoder.Encode(res, encoder.EscapeHTML)
	}
}

func BenchmarkJsonRegularString(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		res := ParseChatOld(chatlines)
		jsonStd.Marshal(res)
	}
}

func BenchmarkJsonFastString(b *testing.B) {
	chatlines, _ := parser.GetTextFiles(from, to)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		res := ParseChatOld(chatlines)
		json.Marshal(res)
	}
}

func BenchmarkGetTextFiles(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_, _ = parser.GetTextFiles(from, to)
	}
}
