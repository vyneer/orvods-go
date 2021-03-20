package main

import (
	"encoding/json"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/defrankland/hasherator"
	"github.com/joho/godotenv"
	"github.com/vyneer/orvods-go/parser"
)

var twitchToken string
var twitchTokenURL string = "https://id.twitch.tv/oauth2/token"
var assets hasherator.AssetsDir

// Token holds the necessary elements of Twitch's
// OAuth token JSON response.
type Token struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

// Validation holds the necessary elements of Twitch's
// OAuth token validation JSON response.
type Validation struct {
	Status    int `json:"status"`
	ExpiresIn int `json:"expires_in"`
}

func init() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

func getToken(tokenURL string) {
	var fullTokenResponse Token

	log.Println("Getting the Twitch token.")

	appTokenResponse, err := http.PostForm(tokenURL, url.Values{"client_id": {os.Getenv("TWITCH_CLIENT_ID")}, "client_secret": {os.Getenv("TWITCH_CLIENT_SECRET")},
		"grant_type": {"client_credentials"}})
	if err != nil {
		log.Println("An error occured in getToken.")
		return
	}
	defer appTokenResponse.Body.Close()
	body, err := ioutil.ReadAll(appTokenResponse.Body)
	if err != nil {
		log.Println("An error occured in getToken.")
		return
	}
	json.Unmarshal([]byte(body), &fullTokenResponse)
	twitchToken = fullTokenResponse.AccessToken

	log.Println("Got the Twitch token.")
}

func validateToken(tokenHeader string) (int, error) {
	var fullTokenResponse Validation

	log.Println("Validating the Twitch token.")

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://id.twitch.tv/oauth2/validate", nil)
	req.Header.Set("Authorization", tokenHeader)
	validationTokenResponse, err := client.Do(req)
	if err != nil {
		log.Println("An error occured in validateToken.")
		return 0, err
	}

	defer validationTokenResponse.Body.Close()
	body, err := ioutil.ReadAll(validationTokenResponse.Body)
	if err != nil {
		log.Println("An error occured in validateToken.")
		return 0, err
	}
	json.Unmarshal([]byte(body), &fullTokenResponse)
	if fullTokenResponse.Status != 0 {
		log.Println("An error occured in validateToken.")
		return 0, nil
	}

	log.Printf("Validated the Twitch token, expires in %d.", fullTokenResponse.ExpiresIn)

	return fullTokenResponse.ExpiresIn, nil
}

func getVidInfo(w http.ResponseWriter, r *http.Request) {
	params, ok := r.URL.Query()["id"]

	if !ok || len(params) < 1 {
		log.Println("No URL parameters")
		return
	}

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/youtube/v3/videos", nil)
	log.Printf("Getting Youtube video info (id: %s).", params[0])
	q := req.URL.Query()
	q.Add("part", "liveStreamingDetails")
	q.Add("id", string(params[0]))
	q.Add("key", os.Getenv("YOUTUBE_API_KEY"))
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Accept", "application/json")
	youtubeAPIResponse, err := client.Do(req)
	if err != nil {
		log.Println("An error occured in getVidInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer youtubeAPIResponse.Body.Close()
	body, err := ioutil.ReadAll(youtubeAPIResponse.Body)
	if err != nil {
		log.Println("An error occured in getVidInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func getVODInfo(w http.ResponseWriter, r *http.Request) {
	idParam, idParamOk := r.URL.Query()["id"]
	useridParam, useridParamOk := r.URL.Query()["user_id"]
	afterParam, afterParamOk := r.URL.Query()["after"]
	firstParam := r.URL.Query()["first"]
	typeParam := r.URL.Query()["type"]

	oauthHeader := "OAuth " + twitchToken
	expiry, err := validateToken(oauthHeader)
	if err != nil {
		log.Println("An error occured in getVODInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if expiry == 0 {
		getToken(twitchTokenURL)
	}
	bearerHeader := "Bearer " + twitchToken
	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://api.twitch.tv/helix/videos", nil)
	if idParamOk {
		log.Printf("Getting Twitch single VOD info (id: %s).", idParam[0])
		q := req.URL.Query()
		q.Add("id", string(idParam[0]))
		req.URL.RawQuery = q.Encode()
		req.Header.Set("Authorization", bearerHeader)
		req.Header.Set("Client-ID", os.Getenv("TWITCH_CLIENT_ID"))
	}
	if useridParamOk && !afterParamOk {
		log.Printf("Getting Twitch multiple VOD info (user_id: %s).", useridParam[0])
		q := req.URL.Query()
		q.Add("user_id", string(useridParam[0]))
		q.Add("first", string(firstParam[0]))
		q.Add("type", string(typeParam[0]))
		req.URL.RawQuery = q.Encode()
		req.Header.Set("Authorization", bearerHeader)
		req.Header.Set("Client-ID", os.Getenv("TWITCH_CLIENT_ID"))
	}
	if useridParamOk && afterParamOk {
		q := req.URL.Query()
		q.Add("user_id", string(useridParam[0]))
		q.Add("first", string(firstParam[0]))
		q.Add("type", string(typeParam[0]))
		q.Add("after", string(afterParam[0]))
		req.URL.RawQuery = q.Encode()
		req.Header.Set("Authorization", bearerHeader)
		req.Header.Set("Client-ID", os.Getenv("TWITCH_CLIENT_ID"))
	}
	twitchAPIResponse, err := client.Do(req)
	if err != nil {
		log.Println("An error occured in getVODInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer twitchAPIResponse.Body.Close()
	body, err := ioutil.ReadAll(twitchAPIResponse.Body)
	if err != nil {
		log.Println("An error occured in getVODInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("Got Twitch VOD info, serving.")

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func getUserInfo(w http.ResponseWriter, r *http.Request) {
	params, ok := r.URL.Query()["user_login"]

	if !ok || len(params) < 1 {
		log.Println("No URL parameters")
		return
	}

	oauthHeader := "OAuth " + twitchToken
	expiry, err := validateToken(oauthHeader)
	if err != nil {
		log.Println("An error occured in getUserInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if expiry == 0 {
		getToken(twitchTokenURL)
	}
	bearerHeader := "Bearer " + twitchToken

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://api.twitch.tv/helix/streams", nil)
	log.Printf("Getting Twitch user info (user_login: %s).", params[0])
	q := req.URL.Query()
	q.Add("user_login", string(params[0]))
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Authorization", bearerHeader)
	req.Header.Set("Client-ID", os.Getenv("TWITCH_CLIENT_ID"))
	twitchAPIResponse, err := client.Do(req)
	if err != nil {
		log.Println("An error occured in getUserInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer twitchAPIResponse.Body.Close()
	body, err := ioutil.ReadAll(twitchAPIResponse.Body)
	if err != nil {
		log.Println("An error occured in getUserInfo.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Got Twitch user info (user_login: %s), serving.", params[0])

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func getEmotes(w http.ResponseWriter, r *http.Request) {
	log.Println("Getting d.gg emotes.")

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://cdn.destiny.gg/emotes/emotes.json", nil)
	emotesResponse, err := client.Do(req)
	if err != nil {
		log.Println("An error occured in getEmotes.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer emotesResponse.Body.Close()
	body, err := ioutil.ReadAll(emotesResponse.Body)
	if err != nil {
		log.Println("An error occured in getEmotes.")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("Got d.gg emotes, serving.")

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

// maxClients limits the amount of simultaneous clients
// stolen from https://www.pauladamsmith.com/blog/2016/04/max-clients-go-net-http.html
func maxClients(h http.Handler, n int) http.Handler {
	sema := make(chan struct{}, n)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sema <- struct{}{}
		defer func() { <-sema }()

		h.ServeHTTP(w, r)
	})
}

func getChat(w http.ResponseWriter, r *http.Request) {
	var jsonData []byte
	urlsParam := r.URL.Query()["urls"]
	fromParam := r.URL.Query()["from"]
	toParam := r.URL.Query()["to"]

	log.Printf("Getting chatlogs (URLS: %s, from: %s, to: %s).", urlsParam[0], fromParam[0], toParam[0])
	start := time.Now()

	chatlines, _ := parser.GetTextFiles(urlsParam[0], fromParam[0], toParam[0])
	jsonResponse := parser.ParseChat(chatlines)

	elapsed := time.Since(start)
	log.Printf("Parsed chatlogs (URLS: %s, from: %s, to: %s), took %s, serving.", urlsParam[0], fromParam[0], toParam[0], elapsed)

	jsonData, _ = json.Marshal(jsonResponse)
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonData)
}

func createIndex() {
	log.Printf("Creating the index.html and hashbusting everything else...")
	_ = assets.Run("./assets/", "./public/", []string{"css", "lib", "octicons", "flairs"})

	f, err := os.Create("./public/index.html")
	if err != nil {
		log.Println("Error in creating index.html: ", err)
		return
	}

	tmpl, errTmpl := template.ParseFiles("templates/index.html")
	if errTmpl != nil {
		log.Fatal(errTmpl)
	}
	err = tmpl.ExecuteTemplate(f, "index", assets.Map)
	if err != nil {
		log.Println("Error executing template:", err)
		return
	}
	f.Close()
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	maxclients, _ := strconv.Atoi(os.Getenv("MAX_CLIENTS"))
	if maxclients == 0 {
		maxclients = 15
	}

	log.Printf("Got port %s with max concurrent clients %d.", port, maxclients)

	createIndex()

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("public"))
	mux.Handle("/", fs)
	mux.HandleFunc("/vidinfo", getVidInfo)
	mux.HandleFunc("/vodinfo", getVODInfo)
	mux.HandleFunc("/userinfo", getUserInfo)
	mux.HandleFunc("/emotes", getEmotes)

	getChatHandler := http.HandlerFunc(getChat)
	mux.Handle("/chat", maxClients(getChatHandler, maxclients))

	log.Println("Starting the server...")
	http.ListenAndServe(":"+port, mux)
}
