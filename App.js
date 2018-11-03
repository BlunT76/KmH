import React, { Component } from "react";
import {
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  Dimensions,
  PixelRatio
} from "react-native";
import {
  Constants,
  Location,
  Permissions,
  KeepAwake,
  Font,
  IntentLauncherAndroid
} from "expo";

const mapQuest =
  "https://overpass-api.de/api/interpreter?data=[out:json];way[maxspeed]";
let displayC;
let displayD;
let displayU;
let travelDisplay;
//let arr = [{motorway:130},{trunk:110},{trunk_link:110},{primary},{secondary},{tertiary},{residential:50},{living_street:50}]

//detecte les dimensions de l'écran
const widthPercentageToDP = widthPercent => {
  const screenWidth = Dimensions.get("window").width;
  // Convert string input to decimal number
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};
const heightPercentageToDP = heightPercent => {
  const screenHeight = Dimensions.get("window").height;
  // Convert string input to decimal number
  const elemHeight = parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};
export { widthPercentageToDP, heightPercentageToDP };

class KmH extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lastLatitude: null,
      lastLongitude: null,
      latitude: null,
      longitude: null,
      speed: 0,
      lastSpeed: null,
      speedDisplay: 0,
      maxSpeed: "?",
      maxSpeedActive: true,
      maxSpeedInterval: null,
      activeColor: null,
      error: null,
      errorMessage: null,
      fontLoaded: false,
      speedColor: "green",
      hourMinutes: "",
      traveled: 0
    };
  }
  componentWillMount() {
    if (Platform.OS === "android" && !Constants.isDevice) {
      this.setState({
        errorMessage:
          "Oops, this will not work on Sketch in an Android emulator. Try it on your device!"
      });
    } else {
      this._getLocationAsync();
    }
  }
  _getLocationAsync = async () => {
    //Check Location services
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied"
      });
    }
  };

  async componentDidMount() {
    //Charge la font digital
    await Font.loadAsync({
      digital: require("./assets/fonts/digital-7.ttf")
    });
    this.setState({ fontLoaded: true });

    //Active/desactive la vitesse maxi
    this._onPressButton = () => {
      if (this.state.maxSpeedActive == false) {
        this.setState({
          maxSpeedActive: true,
          activeColor: "white",
          maxSpeedInterval: setInterval(this.funcMaxSpeed, 20000)
        });
        console.log("requete vitesse limite max activée");
      } else {
        this.setState({
          maxSpeedActive: false,
          activeColor: "black",
          maxSpeedInterval: clearInterval(this.state.maxSpeedInterval)
        });
        console.log("requete vitesse limite max désactivée");
      }
    };

    //Requete de la vitesse maxi dans la zone en cours
    this.funcMaxSpeed = () => {
      console.log("requete vitesse maxi !!!");
      if ((this.state.latitude != null) & (this.state.longitude != null)) {
        console.log("here!!!");
        //https://www.overpass-api.de/api/interpreter?data=[out:json];node[highway=speed_camera](43.46669501043081,-5.708215989569187,43.588927989569186,-5.605835010430813);out%20meta;
        //https://overpass-api.de/api/interpreter?data=[out:json];way[maxspeed](around:1.0,43.110332,%200.734654);out%20tags;
        fetch(
          `${mapQuest}(around:2.0,${this.state.latitude},${
            this.state.longitude
          });out%20tags;`,
          //`${mapQuest}(around:1.0,43.110332,0.734654);out%20tags;`,
          {
            method: "GET"
          }
        )
          .then(response => response.json())
          .then(responseJson => {
            console.log(responseJson.elements[0].tags.maxspeed);
            if (responseJson.elements[0].tags.maxspeed != null) {
              //console.log(responseJson.results[0].locations[0]);
              this.setState({
                maxSpeed: responseJson.elements[0].tags.maxspeed
              });
              console.log("MAXSPEED", this.state.maxSpeed);
            } else {
              // fetch(
              //   //`${mapQuest}(around:2.0,${this.state.latitude},${this.state.longitude});out%20tags;`,
              //   `${mapQuest}(around:5.0,43.110332,0.734654);out%20tags;`,
              //   {
              //     method: "GET"
              //   }
              // )
              // .then(response => response.json())
              // .then(responseJson => {
              //   console.log(responseJson.elements[0].tags.highway)
              //   if (
              //     responseJson.elements[0].tags.highway !=
              //     null
              //   ) {
              //     //console.log(responseJson.results[0].locations[0]);

              //     this.setState({
              //       maxSpeed:
              //       responseJson.elements[0].tags.maxspeed
              //     });
              //     console.log("MAXSPEED", this.state.maxSpeed);
              //   } else {
              this.setState({
                maxSpeed: "?"
              });
              console.log("no result");
            }
          })
          .catch(error => {
            this.setState({
              maxSpeed: "?"
            });
            if (this.state.maxSpeedActive == false) {
              clearInterval(this.funcMaxSpeed);
            }
            console.log(error);
          });
      }
    };

    //Requete de la vitesse du vehicule
    this.watchId = await Location.watchPositionAsync(
      { enableHighAccuracy: true, timeout: 1000, distanceInterval: 1 },
      position => {
        let lat = +position.coords.latitude.toFixed(5);
        let lon = +position.coords.longitude.toFixed(5);
        //console.log("lat:", lat, "lon:", lon);
        //console.log("ACCURACY", position.coords.accuracy);
        if (this.state.lastLatitude == null) {
          this.setState({
            lastLatitude: +position.coords.latitude.toFixed(5),
            lastLongitude: +position.coords.latitude.toFixed(5),
            lastSpeed: 0
          });
        }
        if (
          Math.abs(lat - this.state.lastLatitude) > 0 ||
          Math.abs(lon - this.state.lastLongitude) > 0
        ) {
          let t = new Date(position.timestamp).toLocaleTimeString("fr-FR");
          t = t.substring(0, t.length - 3);
          this.setState({
            lastLatitude: this.state.latitude,
            lastLongitude: this.state.longitude,
            latitude: lat,
            longitude: lon,
            lastSpeed: this.state.speed,
            speed: Math.round(position.coords.speed * 3.6),
            hourMinutes: t,
            error: null
          });
          //Appel de la fonction pour le comptage kilometrique
          this.haversineDistance(
            [this.state.lastLatitude, this.state.lastLongitude],
            [this.state.latitude, this.state.longitude],
            false
          );
        } else {
          //Rejet de la position
          console.log(
            "Rejected | lat:",
            lat,
            ",lon:",
            lon,
            " Difference:",
            Math.abs(lat - this.state.lastLatitude),
            ",",
            Math.abs(lon - this.state.lastLongitude),
            "speed:",
            this.state.speed
          );
        }
      },
      error => this.setState({ error: error.message })
    );
    //Incrementation du compteur de facon realiste
    this._intervalDisplay = setInterval(() => {
      if (this.state.speedDisplay < this.state.speed) {
        this.setState({
          speedDisplay: this.state.speedDisplay + 1
        });
      } else if (this.state.speedDisplay > this.state.speed) {
        this.setState({
          speedDisplay: this.state.speedDisplay - 1
        });
      }
    }, 50);
    //Calcul de la distance parcourue
    this.haversineDistance = (latlngA, latlngB, isMiles) => {
      const toRad = x => (x * Math.PI) / 180;
      const R = 6371; // km

      const dLat = toRad(latlngB[0] - latlngA[0]);
      const dLatSin = Math.sin(dLat / 2);
      const dLon = toRad(latlngB[1] - latlngA[1]);
      const dLonSin = Math.sin(dLon / 2);

      // prettier-ignore
      const a = dLatSin * dLatSin +Math.cos(toRad(latlngA[1])) * Math.cos(toRad(latlngB[1])) * dLonSin * dLonSin;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      let distance = R * c;

      //if (isMiles) distance /= 1.60934;
      if (distance < 1 && this.state.speed > 5) {
        this.setState({
          traveled: this.state.traveled + distance
        });
      }
      //console.log("DISTANCE: ", +this.state.traveled.toFixed(1), distance);
    };
  }

  componentWillUnmount() {
    this.setState({
      maxSpeedInterval: clearInterval(this.state.maxSpeedInterval)
    });
    clearInterval(this._intervalDisplay);
  }

  render() {
    console.log("Lat: ", this.state.latitude, this.state.longitude);
    //console.log(this.state.speedDisplay)
    //Séparation et affichage des caractères de la vitesse
    displayU = this.state.speedDisplay % 10;
    if (this.state.speed > 10) {
      displayD = Math.floor((this.state.speedDisplay % 100) / 10);
    } else {
      displayD = "";
    }
    if (this.state.speed > 100) {
      displayC = Math.floor(this.state.speedDisplay / 100);
    } else {
      displayC = "";
    }
    //Couleur des caractéres de la vitesse en fonction de la vitesse maxi
    if (
      this.state.maxSpeed == "" ||
      this.state.speedDisplay < this.state.maxSpeed
    ) {
      this.state.speedColor = "green";
    }
    if (
      this.state.maxSpeed != "" &&
      this.state.speedDisplay > this.state.maxSpeed
    ) {
      this.state.speedColor = "orange";
    }
    if (
      this.state.maxSpeed != "" &&
      this.state.speedDisplay > this.state.maxSpeed + 5
    ) {
      this.state.speedColor = "red";
    }
    //Affichage de la distance parcourue
    travelDisplay = +this.state.traveled.toFixed(1);
    return (
      <View style={styles.container}>
        <KeepAwake />
        {this.state.fontLoaded ? (
          <View
            style={{
              width: widthPercentageToDP("100%"),
              height: heightPercentageToDP("70%")
            }}
          >
            <View style={styles.speedometer}>
              <Text style={[styles.vitesse, { color: this.state.speedColor }]}>
                {displayC}
              </Text>
              <Text style={[styles.vitesse, { color: this.state.speedColor }]}>
                {displayD}
              </Text>
              <Text style={[styles.vitesse, { color: this.state.speedColor }]}>
                {displayU}
              </Text>
              {/* <Text style={[styles.vitesse, {color: this.state.speedColor}]}>1</Text>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>1</Text>
                  <Text style={[styles.vitesse, {color: this.state.speedColor}]}>0</Text> */}
              <Text style={styles.kmh}>Km/h</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bottomContainer}>
          {this.state.fontLoaded ? (
            <View>
              <Text style={styles.hour}>{this.state.hourMinutes}</Text>
            </View>
          ) : null}
          {this.state.fontLoaded ? (
            <View style={styles.bottomCenterContainer}>
              <View>
                <Text style={styles.hour}>{travelDisplay}</Text>
              </View>
              <View style={{ alignSelf: "flex-end" }}>
                <Text
                  style={[
                    styles.km,
                    { marginBottom: heightPercentageToDP("1%") }
                  ]}
                >
                  km
                </Text>
              </View>
            </View>
          ) : null}
          <View style={styles.circle}>
            <View
              style={[
                styles.circleColorToggle,
                { backgroundColor: this.state.activeColor }
              ]}
            >
              <TouchableHighlight onPress={() => this._onPressButton()}>
                <Text style={{ fontSize: heightPercentageToDP("10%") }}>
                  {this.state.maxSpeed}
                </Text>
              </TouchableHighlight>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
    //borderColor: 'red',
    //borderWidth: 1,
  },
  bottomContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
    //borderColor: 'blue',
    //borderWidth: 1,
  },
  bottomCenterContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
    //borderColor: 'blue',
  },
  circle: {
    width: heightPercentageToDP("30%"),
    height: heightPercentageToDP("30%"),
    borderColor: "red",
    borderWidth: heightPercentageToDP("5%"),
    borderRadius: 360,
    backgroundColor: "white"
  },
  circleColorToggle: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 360
  },
  speedometer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    //borderColor: 'blue',
    //borderWidth: 1,
    margin: 0,
    padding: 0
  },
  vitesse: {
    //flex:1,
    width: widthPercentageToDP("22%"),
    fontFamily: "digital",
    fontSize: heightPercentageToDP("75%"),
    textAlign: "right",
    textAlignVertical: "bottom",
    includeFontPadding: false,
    alignSelf: "flex-end",
    backgroundColor: "transparent",
    margin: 0,
    padding: 0
    //borderColor: 'red',
    //borderWidth: 1,
  },
  kmh: {
    fontFamily: "digital",
    fontSize: heightPercentageToDP("10%"),
    color: "white"
  },
  hour: {
    fontFamily: "digital",
    fontSize: heightPercentageToDP("20%"),
    color: "white",
    marginLeft: widthPercentageToDP("5%")
  },
  km: {
    fontFamily: "digital",
    fontSize: heightPercentageToDP("8%"),
    color: "white"
    //marginLeft: widthPercentageToDP("10%"),
    //borderColor: 'blue',
    //borderWidth: 1,
  }
});
export default KmH;
