import {View} from 'react-native'
import React from 'react'
import {Tabs} from "expo-router";
import TabIcon from "@/components/common/TabIcon";

const _Layout = () => {
    return (
        <View style={{flex: 1}}>
            <Tabs screenOptions={{
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#c6d2ff',
                },
                tabBarIconStyle: {
                    marginTop: 10
                }
            }}>
                <Tabs.Screen name={"index"} options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon iconType={"home"} focused={focused} />
                    )
                }}/>
                <Tabs.Screen name={"scan"} options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon iconType={"scan"} focused={focused} />
                    )
                }}/>
                <Tabs.Screen name={"create"} options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon iconType={"create"} focused={focused} />
                    )
                }}/>
                <Tabs.Screen name={"recommendation"} options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon iconType={"recommendation"} focused={focused} />
                    )
                }}/>
                <Tabs.Screen name={"profile"} options={{
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon iconType={"profile"} focused={focused} />
                    )
                }}/>
            </Tabs>
        </View>
    )
}
export default _Layout
