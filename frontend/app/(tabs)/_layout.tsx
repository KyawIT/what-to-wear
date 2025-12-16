import {View, Text} from 'react-native'
import React from 'react'
import {Tabs} from "expo-router";
import {Globe} from "lucide-react-native"

const _Layout = () => {
    return (
        <View style={{flex: 1}}>
            <Tabs screenOptions={{
                tabBarShowLabel: false,
            }}>
                <Tabs.Screen name={"index"} options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <Globe />
                    )
                }}/>
            </Tabs>
        </View>
    )
}
export default _Layout
